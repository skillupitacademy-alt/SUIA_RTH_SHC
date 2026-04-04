import { TokenService, type TokenPayload as BrandTokenPayload } from '@quiz/auth';
import type { IUserRepository } from '@quiz/types';

import type { SkillhubCallbackValidationResult, PlatformName, UserRole } from './auth.types';

type RedisLike = {
  set: (key: string, value: string, options?: Record<string, unknown>) => Promise<unknown>;
};

const brandTokenService = new TokenService();

function normalizeBrand(value: unknown): PlatformName | undefined {
  if (value === 'realtutorialhub' || value === 'skillup') {
    return value;
  }

  return undefined;
}

function normalizeRoles(roles: unknown): UserRole[] {
  const values = Array.isArray(roles) ? roles : [];
  const mapped = values
    .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
    .map((role) => role.trim().toLowerCase())
    .flatMap<UserRole>((role) => {
      if (role === 'student' || role === 'faculty' || role === 'admin' || role === 'super_admin') {
        return [role];
      }
      if (role === 'super admin') return ['super_admin'];
      return [];
    });

  return mapped.length > 0 ? Array.from(new Set(mapped)) : ['student'];
}

function normalizeSubscriptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function resolveOriginalUserId(payload: BrandTokenPayload): string {
  const candidate =
    typeof payload.originalUserId === 'string' && payload.originalUserId.trim().length > 0
      ? payload.originalUserId
      : typeof payload.userId === 'string' && payload.userId.trim().length > 0
        ? payload.userId
        : typeof payload.sub === 'string' && payload.sub.trim().length > 0
          ? payload.sub
          : undefined;

  if (candidate === undefined) {
    throw new Error('Brand token missing user identity');
  }

  return candidate.trim();
}

function resolveShadowUserId(payload: BrandTokenPayload, originalUserId: string): string {
  if (typeof payload.shadowUserId === 'string' && payload.shadowUserId.trim().length > 0) {
    return payload.shadowUserId.trim();
  }

  return originalUserId;
}

export class TokenValidatorService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly redis: RedisLike,
  ) {}

  private getRefreshKey(familyId: string): string {
    return `skillhubcore:refresh:${familyId}`;
  }

  async validateBrandAccessToken(accessToken: string, expectedBrand: PlatformName): Promise<SkillhubCallbackValidationResult> {
    const payload = await brandTokenService.verifyUserAccessToken(accessToken, { audience: 'user' });
    const originalUserId = resolveOriginalUserId(payload);
    const shadowUserId = resolveShadowUserId(payload, originalUserId);
    const tokenBrand = normalizeBrand(payload.brand);
    if (tokenBrand === undefined) {
      throw new Error('Brand token missing brand claim');
    }
    if (tokenBrand !== expectedBrand) {
      throw new Error('Brand token does not match requested platform');
    }

    const brand = tokenBrand;
    const roles = normalizeRoles(payload.roles);
    const subscriptions = normalizeSubscriptions(payload.subscriptions);
    const platforms = Array.from(
      new Set<PlatformName>(
        [brand, ...(Array.isArray(payload.platforms) ? payload.platforms : [])]
          .map(normalizeBrand)
          .filter((platform): platform is PlatformName => platform !== undefined)
      )
    );
    const familyId = TokenService.generateFamilyId();

    const [skillhubToken, refreshToken] = await Promise.all([
      this.tokenService.signSkillHubCoreAccessToken(shadowUserId, roles, subscriptions, platforms, {
        originalUserId,
        shadowUserId,
        brand,
      }),
      this.tokenService.signSkillHubCoreRefreshToken(shadowUserId, familyId),
    ]);

    await this.redis.set(this.getRefreshKey(familyId), refreshToken);
    await this.userRepo.transaction(async (repo) => {
      await repo.createTokenFamily({ userId: shadowUserId, familyId });
      await repo.createSession({
        userId: shadowUserId,
        jwtFamily: familyId,
        platform: brand,
        refreshTokenHash: refreshToken,
      });
      await repo.createAuditLog({
        actorId: shadowUserId,
        action: 'cross_domain_auth_validated',
        platform: brand,
        success: true,
        metadata: {
          originalUserId,
          shadowUserId,
          roles,
          platforms,
        },
      });
    });

    return {
      skillhubToken,
      refreshToken,
      shadowUserId,
      originalUserId,
      brand,
      roles,
      platforms,
      subscriptions,
    };
  }
}
