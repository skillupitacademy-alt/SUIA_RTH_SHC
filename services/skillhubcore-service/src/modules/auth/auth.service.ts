import type { AuthResult, AuthUserDTO, LoginInput, RegisterInput } from './auth.types';
import { PasswordService } from './password.service';
import { TokenInvalidError, TokenService } from './token.service';
import { DrizzleUserRepository } from '../user/user.repository';

const FREE_SUBSCRIPTIONS = ['notes'];

export class AuthService {
  constructor(
    private readonly userRepo: DrizzleUserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly redis: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string, options?: Record<string, unknown>) => Promise<unknown>;
      del: (key: string) => Promise<unknown>;
    }
  ) {}

  private getRefreshKey(familyId: string): string {
    return `skillhubcore:refresh:${familyId}`;
  }

  private toUserDto(user: { id: string; email: string; role: AuthUserDTO['roles'][number] }, platforms: string[], subscriptions: string[]): AuthUserDTO {
    return {
      id: user.id,
      email: user.email,
      roles: [user.role],
      platforms: platforms as AuthUserDTO['platforms'],
      subscriptions,
    };
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing !== undefined) {
      throw new Error('Email already exists');
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const familyId = TokenService.generateFamilyId();

    return this.userRepo.transaction(async (repo) => {
      const user = await repo.createUser({
        email: input.email,
        passwordHash,
        role: input.role ?? 'student',
        platform: input.platform,
      });

      await repo.grantPlatformAccess(user.id, input.platform);
      await repo.createSubscription({
        userId: user.id,
        planType: 'free',
        features: FREE_SUBSCRIPTIONS,
      });
      await repo.createTokenFamily({ userId: user.id, familyId });

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(user.id, [user.role], FREE_SUBSCRIPTIONS, [input.platform]),
      this.tokenService.signRefreshToken(user.id, familyId),
    ]);

      await this.redis.set(this.getRefreshKey(familyId), refreshToken);
      await repo.createSession({
        userId: user.id,
        jwtFamily: familyId,
        platform: input.platform,
        refreshTokenHash: refreshToken,
      });
      await repo.createAuditLog({
        actorId: user.id,
        action: 'register',
        platform: input.platform,
        success: true,
      });

      return {
        accessToken,
        refreshToken,
        user: this.toUserDto(user, [input.platform], FREE_SUBSCRIPTIONS),
      };
    });
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (user === undefined) {
      throw new Error('Invalid credentials');
    }

    if (user.isActive !== true || user.deletedAt !== null) {
      throw new Error('User suspended');
    }

    const validPassword = await this.passwordService.compare(input.password, user.passwordHash);
    if (!validPassword) {
      await this.userRepo.createAuditLog({
        actorId: user.id,
        action: 'login',
        platform: input.platform,
        success: false,
        metadata: { reason: 'invalid_password' },
      });
      throw new Error('Invalid credentials');
    }

    const platforms = await this.userRepo.listPlatforms(user.id);
    if (!platforms.includes(input.platform)) {
      await this.userRepo.grantPlatformAccess(user.id, input.platform);
    }

    const subscription = await this.userRepo.getActiveSubscription(user.id);
    const subscriptions = Array.isArray(subscription?.features) && subscription.features.length > 0 ? subscription.features : FREE_SUBSCRIPTIONS;
    const familyId = TokenService.generateFamilyId();

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(user.id, [user.role], subscriptions, platforms),
      this.tokenService.signRefreshToken(user.id, familyId),
    ]);

    await this.redis.set(this.getRefreshKey(familyId), refreshToken);
    await this.userRepo.transaction(async (repo) => {
      await repo.createTokenFamily({ userId: user.id, familyId });
      await repo.createSession({
        userId: user.id,
        jwtFamily: familyId,
        platform: input.platform,
        refreshTokenHash: refreshToken,
      });
      await repo.createAuditLog({
        actorId: user.id,
        action: 'login',
        platform: input.platform,
        success: true,
      });
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserDto(user, platforms, subscriptions),
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const family = await this.userRepo.findTokenFamilyByFamilyId(payload.family);
    if (family === undefined) {
      throw new TokenInvalidError('Invalid refresh token');
    }

    const storedRefreshToken = await this.redis.get(this.getRefreshKey(payload.family));
    if (storedRefreshToken !== null && storedRefreshToken !== refreshToken) {
      await this.userRepo.markTokenFamilyCompromised(payload.family);
      await this.userRepo.revokeAllSessions(payload.sub, 'compromised_family');
      await this.userRepo.createAuditLog({
        actorId: payload.sub,
        action: 'token_family_compromised',
        success: false,
        metadata: { familyId: payload.family },
      });
      throw new Error('Session compromised');
    }

    if ((family as { isCompromised?: boolean }).isCompromised === true) {
      await this.userRepo.revokeAllSessions(payload.sub, 'compromised_family');
      throw new Error('Session compromised');
    }

    const existingSession = await this.userRepo.findSessionByFamily(payload.sub, payload.family);
    if (existingSession === undefined) {
      throw new TokenInvalidError('Invalid refresh token');
    }

    if ((existingSession as { revokedAt?: Date | null }).revokedAt !== null) {
      await this.userRepo.markTokenFamilyCompromised(payload.family);
      await this.userRepo.revokeAllSessions(payload.sub, 'compromised_family');
      await this.userRepo.createAuditLog({
        actorId: payload.sub,
        action: 'token_family_compromised',
        success: false,
        metadata: { familyId: payload.family },
      });
      throw new Error('Session compromised');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (user === undefined) {
      throw new TokenInvalidError('Invalid refresh token');
    }

    const platforms = await this.userRepo.listPlatforms(user.id);
    const subscription = await this.userRepo.getActiveSubscription(user.id);
    const subscriptions = Array.isArray(subscription?.features) && subscription.features.length > 0 ? subscription.features : FREE_SUBSCRIPTIONS;

    const [accessToken, nextRefreshToken] = await Promise.all([
      this.tokenService.signAccessToken(user.id, [user.role], subscriptions, platforms),
      this.tokenService.signRefreshToken(user.id, payload.family),
    ]);

    await this.userRepo.transaction(async (repo) => {
      await repo.revokeSessionByFamily(payload.sub, payload.family, 'rotated');
      await repo.createSession({
        userId: user.id,
        jwtFamily: payload.family,
        platform: platforms[0] ?? 'realtutorialhub',
        refreshTokenHash: nextRefreshToken,
      });
      await repo.updateTokenFamilyUsage(payload.family);
      await this.redis.set(this.getRefreshKey(payload.family), nextRefreshToken);
      await repo.createAuditLog({
        actorId: user.id,
        action: 'refresh',
        success: true,
      });
    });

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      user: this.toUserDto(user, platforms, subscriptions),
    };
  }

  async logout(userId: string, familyId: string): Promise<void> {
    await this.userRepo.revokeSessionByFamily(userId, familyId, 'logout');
    await this.redis.del(this.getRefreshKey(familyId));
    await this.userRepo.createAuditLog({
      actorId: userId,
      action: 'logout',
      success: true,
    });
  }
}
