import { randomUUID } from 'crypto';

import { describe, expect, it, vi } from 'vitest';

import { TokenService as BrandTokenService } from '@quiz/auth';

import { TokenService } from '../token.service';
import { TokenValidatorService } from '../token-validator.service';
import type { IUserRepository } from '@quiz/types';

class FakeRedis {
  readonly store = new Map<string, string>();

  set = vi.fn(async (key: string, value: string) => {
    this.store.set(key, value);
    return 'OK';
  });
}

class FakeRepo {
  readonly sessions = new Map<string, { userId: string; platform: string }>();
  readonly tokenFamilies = new Map<string, string>();
  readonly audits: Array<Record<string, unknown>> = [];

  withDb() {
    return this;
  }

  async transaction<T>(callback: (repo: IUserRepository) => Promise<T>): Promise<T> {
    return callback(this as unknown as IUserRepository);
  }

  async createTokenFamily(input: { userId: string; familyId: string }) {
    this.tokenFamilies.set(input.familyId, input.userId);
    return input;
  }

  async createSession(input: { userId: string; jwtFamily: string; platform: any; refreshTokenHash: string }) {
    this.sessions.set(input.jwtFamily, { userId: input.userId, platform: input.platform });
    return input;
  }

  async createAuditLog(input: Record<string, unknown>) {
    this.audits.push(input);
    return input;
  }

  async findByEmail() { return undefined; }
  async findById() { return undefined; }
  async createUser() { throw new Error('not implemented'); }
  async createSubscription() { throw new Error('not implemented'); }
  async grantPlatformAccess() { throw new Error('not implemented'); }
  async revokePlatformAccess() { throw new Error('not implemented'); }
  async listPlatforms() { return []; }
  async getActiveSubscription() { return undefined; }
  async listActiveSessions() { return []; }
  async findSessionById() { return null; }
  async revokeSessionById() { return undefined; }
  async findSessionByFamily() { return undefined; }
  async revokeSessionByFamily() { return undefined; }
  async revokeAllSessions() { return undefined; }
  async findTokenFamilyByFamilyId() { return undefined; }
  async markTokenFamilyCompromised() { return undefined; }
  async updateTokenFamilyUsage() { return undefined; }
}

describe('TokenValidatorService', () => {
  it('validates a brand token and issues a shared skillhub token', async () => {
    const repo = new FakeRepo();
    const redis = new FakeRedis();
    const tokenService = new TokenService(
      new TextEncoder().encode('shared-access-secret-1234567890'),
      new TextEncoder().encode('shared-refresh-secret-1234567890'),
    );
    const validator = new TokenValidatorService(repo as unknown as IUserRepository, tokenService, redis);
    const brandTokenService = new BrandTokenService();
    const brandToken = await brandTokenService.generateAccessToken({
      userId: 'brand-user-1',
      originalUserId: 'brand-user-1',
      shadowUserId: 'shadow-user-1',
      email: 'student@example.com',
      roles: ['STUDENT'],
      brand: 'skillup',
      isAdmin: false,
      subscriptions: ['tutorial.preview_only'],
    });

    const result = await validator.validateBrandAccessToken(brandToken);
    const payload = await tokenService.verifyAccessToken(result.skillhubToken);

    expect(result.shadowUserId).toBe('shadow-user-1');
    expect(result.originalUserId).toBe('brand-user-1');
    expect(result.brand).toBe('skillup');
    expect(payload.sub).toBe('shadow-user-1');
    expect(payload.shadowUserId).toBe('shadow-user-1');
    expect(payload.originalUserId).toBe('brand-user-1');
    expect(payload.platforms).toContain('skillup');
    expect(repo.sessions.size).toBe(1);
    expect(repo.tokenFamilies.size).toBe(1);
    expect(redis.set).toHaveBeenCalledTimes(1);
  });

  it('falls back to the original user id when older brand tokens omit shadowUserId', async () => {
    const repo = new FakeRepo();
    const redis = new FakeRedis();
    const tokenService = new TokenService(
      new TextEncoder().encode('shared-access-secret-abcdef123456'),
      new TextEncoder().encode('shared-refresh-secret-abcdef123456'),
    );
    const validator = new TokenValidatorService(repo as unknown as IUserRepository, tokenService, redis);
    const brandTokenService = new BrandTokenService();
    const brandToken = await brandTokenService.generateAccessToken({
      userId: `brand-${randomUUID()}`,
      email: 'student@example.com',
      roles: ['student'],
      brand: 'realtutorialhub',
      isAdmin: false,
    });

    const result = await validator.validateBrandAccessToken(brandToken);
    expect(result.shadowUserId).toBe(result.originalUserId);
  });
});
