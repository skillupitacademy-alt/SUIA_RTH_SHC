import { TokenService } from '@quiz/auth';
import type { AuthResult, AuthUserDTO, LoginInput, RegisterInput, PlatformName } from './auth.types';
import { PasswordService } from './password.service';
import { TokenValidatorService } from './token-validator.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { SsoService } from './sso/sso.service';
import { TokenRotationService } from './token-rotation.service';
import { publishUserRegistered } from '@/lib/skillhubcore-events';
import type { IUserRepository } from '@quiz/types';

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly subscriptionService: SubscriptionService,
    private readonly ssoService: SsoService,
    private readonly tokenRotationService: TokenRotationService,
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
    const freeFeatures = await this.subscriptionService.getPlanFeatures('free');

    const result = await this.userRepo.transaction(async (repo) => {
      const user = await repo.createUser({
        email: input.email,
        passwordHash,
        role: input.role ?? 'student',
        platform: input.platform,
      });

      const transactionSsoService = this.ssoService.withRepository(repo);
      const platforms = await transactionSsoService.grantPlatformAccess(user.id, input.platform);
      await repo.createSubscription({
        userId: user.id,
        planType: 'free',
        features: freeFeatures,
      });
      await repo.createTokenFamily({ userId: user.id, familyId });
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.signSkillHubCoreAccessToken(user.id, [user.role], freeFeatures, platforms),
        this.tokenService.signSkillHubCoreRefreshToken(user.id, familyId),
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
        user: this.toUserDto(user, platforms, freeFeatures),
      };
    });

    await publishUserRegistered({
      userId: result.user.id,
      email: result.user.email,
      platform: input.platform,
      role: input.role ?? 'student',
      registeredAt: new Date().toISOString(),
    });

    return result;
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

    const platforms = await this.ssoService.grantPlatformAccess(user.id, input.platform);

    const subscriptions = await this.subscriptionService.getFeatures(user.id);
    const familyId = TokenService.generateFamilyId();

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signSkillHubCoreAccessToken(user.id, [user.role], subscriptions, platforms),
      this.tokenService.signSkillHubCoreRefreshToken(user.id, familyId),
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
    return this.tokenRotationService.rotate(refreshToken);
  }

  async loginAdmin(email: string, password: string): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(email);
    if (user === undefined) {
      throw new Error('Invalid credentials');
    }

    if (user.isActive !== true || user.deletedAt !== null) {
      throw new Error('User suspended');
    }

    const validPassword = await this.passwordService.compare(password, user.passwordHash);
    if (!validPassword) {
      await this.userRepo.createAuditLog({
        actorId: user.id,
        action: 'admin_login',
        success: false,
        metadata: { reason: 'invalid_password' },
      });
      throw new Error('Invalid credentials');
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new Error('Forbidden');
    }

    const subscriptions = await this.subscriptionService.getFeatures(user.id);
    const configuredPlatforms = await this.userRepo.listPlatforms(user.id);
    const platforms: PlatformName[] = configuredPlatforms.length > 0
      ? configuredPlatforms
      : ['realtutorialhub', 'skillup'];
    const familyId = TokenService.generateFamilyId();

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signSkillHubCoreAccessToken(user.id, [user.role], subscriptions, platforms, {
        originalUserId: user.id,
        shadowUserId: user.id,
        brand: platforms[0] ?? 'realtutorialhub',
      }),
      this.tokenService.signSkillHubCoreRefreshToken(user.id, familyId),
    ]);

    await this.redis.set(this.getRefreshKey(familyId), refreshToken);
    await this.userRepo.transaction(async (repo) => {
      await repo.createTokenFamily({ userId: user.id, familyId });
      await repo.createSession({
        userId: user.id,
        jwtFamily: familyId,
        platform: (platforms[0] ?? 'realtutorialhub') as PlatformName,
        refreshTokenHash: refreshToken,
      });
      await repo.createAuditLog({
        actorId: user.id,
        action: 'admin_login',
        success: true,
      });
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserDto(user, platforms, subscriptions),
    };
  }

  async getUserSessions(userId: string, platform: 'realtutorialhub' | 'skillup') {
    const sessions = await this.userRepo.listActiveSessions(userId);
    return sessions.filter((session) => session.platform === platform);
  }

  async revokeSession(userId: string, sessionId: string, platform: 'realtutorialhub' | 'skillup'): Promise<void> {
    const session = await this.userRepo.findSessionById(userId, sessionId);
    if (session === null || session.platform !== platform) {
      throw new Error('Session not found');
    }

    await this.userRepo.revokeSessionById(userId, sessionId, `user_revoked:${platform}`);
    await this.userRepo.createAuditLog({
      actorId: userId,
      action: 'session_revoked',
      platform,
      metadata: { sessionId, reason: 'user_revoked', platform },
    });
  }

  async revokeAllSessions(userId: string, platform: 'realtutorialhub' | 'skillup'): Promise<void> {
    const sessions = await this.getUserSessions(userId, platform);
    await Promise.all(sessions.map((session) => this.userRepo.revokeSessionById(userId, session.id, `user_revoked_all:${platform}`)));
    await this.userRepo.createAuditLog({
      actorId: userId,
      action: 'all_sessions_revoked',
      platform,
      metadata: { reason: 'user_revoked_all', platform },
    });
  }

  async logout(userId: string, familyId: string): Promise<void> {
    await this.userRepo.revokeSessionByFamily(userId, familyId, 'logout');
    await this.redis.del(`skillhubcore:refresh:${familyId}`);
    await this.userRepo.createAuditLog({
      actorId: userId,
      action: 'logout',
      success: true,
    });
  }

  createTokenValidatorService(): TokenValidatorService {
    return new TokenValidatorService(this.userRepo, this.tokenService, this.redis);
  }
}
