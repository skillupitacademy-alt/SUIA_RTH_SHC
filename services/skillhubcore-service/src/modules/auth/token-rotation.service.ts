import { TokenService } from '@quiz/auth';
import type { AuthResult, PlatformName } from './auth.types';
import { SubscriptionService } from '../subscription/subscription.service';
import type { IUserRepository } from '@quiz/types';

export class TokenRotationService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly subscriptionService: SubscriptionService,
    private readonly redis: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string, options?: Record<string, unknown>) => Promise<unknown>;
      del: (key: string) => Promise<unknown>;
    }
  ) {}

  private getRefreshKey(familyId: string): string {
    return `skillhubcore:refresh:${familyId}`;
  }

  private toUserDto(user: { id: string; email: string; role: AuthResult['user']['roles'][number] }, platforms: string[], subscriptions: string[]) {
    return {
      id: user.id,
      email: user.email,
      roles: [user.role],
      platforms: platforms as AuthResult['user']['platforms'],
      subscriptions,
    };
  }

  async rotate(refreshToken: string): Promise<AuthResult> {
    const payload = await this.tokenService.verifySkillHubCoreRefreshToken(refreshToken);
    const family = await this.userRepo.findTokenFamilyByFamilyId(payload.family);
    if (family === undefined) {
      throw new Error('Invalid refresh token');
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
      throw new Error('Invalid refresh token');
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
    if (user === undefined || user.isActive !== true || user.deletedAt !== null) {
      throw new Error('Invalid refresh token');
    }

    const sessionPlatform = (existingSession as { platform?: unknown }).platform;
    const grantedPlatforms = await this.userRepo.listPlatforms(user.id);
    if ((sessionPlatform !== 'skillup' && sessionPlatform !== 'realtutorialhub')
      || user.platform !== sessionPlatform
      || !grantedPlatforms.includes(sessionPlatform)) {
      throw new Error('Invalid refresh token');
    }
    const platforms: PlatformName[] = [sessionPlatform];
    const subscriptions = await this.subscriptionService.getFeatures(user.id);

    const [accessToken, nextRefreshToken] = await Promise.all([
      this.tokenService.signSkillHubCoreAccessToken(user.id, [user.role], subscriptions, platforms),
      this.tokenService.signSkillHubCoreRefreshToken(user.id, payload.family),
    ]);

    await this.userRepo.transaction(async (repo) => {
      await repo.revokeSessionByFamily(payload.sub, payload.family, 'rotated');
      await repo.createSession({
        userId: user.id,
        jwtFamily: payload.family,
        platform: sessionPlatform,
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
}
