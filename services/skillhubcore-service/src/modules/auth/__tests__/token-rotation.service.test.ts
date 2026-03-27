import { randomUUID } from 'crypto';

import { describe, expect, it, vi } from 'vitest';

import { SubscriptionService } from '../../subscription/subscription.service';
import { TokenRotationService } from '../token-rotation.service';
import { PasswordService } from '../password.service';
import { TokenService } from '../token.service';
import type { PeoplePlatform, PeopleSubscriptionRecord, PeopleUserRecord, PeopleUserRole, IUserRepository } from '@quiz/types';
import { SsoService } from '../sso/sso.service';

class FakeRedis {
  private readonly store = new Map<string, string>();

  get = vi.fn(async (key: string) => this.store.get(key) ?? null);
  set = vi.fn(async (key: string, value: string) => {
    this.store.set(key, value);
    return 'OK';
  });
  del = vi.fn(async (key: string) => {
    this.store.delete(key);
    return 1;
  });
}

class FakeSubscriptionService {
  getPlanFeatures = vi.fn(async () => ['tutorial.preview_only']);
  getFeatures = vi.fn(async () => ['tutorial.preview_only']);
  isFeatureEnabled = vi.fn(async () => false);
  onPaymentReceived = vi.fn(async () => undefined);
  invalidateFeaturesCache = vi.fn(async () => undefined);
}

class FakeRepo implements IUserRepository {
  readonly users = new Map<string, PeopleUserRecord & { passwordHash: string }>();
  readonly platforms = new Map<string, PeoplePlatform[]>();
  readonly sessions = new Map<string, { userId: string; jwtFamily: string; platform: PeoplePlatform; revokedAt: Date | null }>();
  readonly families = new Map<string, { userId: string; familyId: string; isCompromised: boolean }>();
  readonly audits: Array<Record<string, unknown>> = [];

  withDb() { return this; }
  async transaction<T>(callback: (repo: IUserRepository) => Promise<T>): Promise<T> { return callback(this); }
  async findByEmail() { return undefined; }
  async findById(userId: string) { return this.users.get(userId); }
  async createUser(input: { email: string; passwordHash: string; role: PeopleUserRole; platform: PeoplePlatform }) {
    const user = {
      id: randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      platform: input.platform,
      isActive: true,
      deletedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    this.platforms.set(user.id, [input.platform]);
    return user;
  }
  async createSubscription(input: { userId: string; planType: 'free' | 'pro' | 'enterprise'; features: string[] }) {
    return { id: randomUUID(), userId: input.userId, planType: input.planType, features: input.features, status: 'active', startedAt: new Date(), expiresAt: null, deletedAt: null } as PeopleSubscriptionRecord;
  }
  async grantPlatformAccess(userId: string, platform: PeoplePlatform) {
    const current = this.platforms.get(userId) ?? [];
    if (!current.includes(platform)) current.push(platform);
    this.platforms.set(userId, current);
    return { userId, platform };
  }
  async revokePlatformAccess(userId: string, platform: PeoplePlatform) {
    this.platforms.set(userId, (this.platforms.get(userId) ?? []).filter((value) => value !== platform));
    return { userId, platform };
  }
  async listPlatforms(userId: string) { return this.platforms.get(userId) ?? []; }
  async getActiveSubscription() { return undefined; }
  async createSession(input: { userId: string; jwtFamily: string; platform: PeoplePlatform; refreshTokenHash: string }) {
    this.sessions.set(input.jwtFamily, { userId: input.userId, jwtFamily: input.jwtFamily, platform: input.platform, revokedAt: null });
    return input;
  }
  async findSessionByFamily(userId: string, familyId: string) {
    const session = this.sessions.get(familyId);
    return session !== undefined && session.userId === userId ? session : undefined;
  }
  async revokeSessionByFamily(userId: string, familyId: string) {
    const session = this.sessions.get(familyId);
    if (session !== undefined && session.userId === userId) session.revokedAt = new Date();
    return session;
  }
  async revokeAllSessions(userId: string) {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) session.revokedAt = new Date();
    }
    return undefined;
  }
  async createTokenFamily(input: { userId: string; familyId: string }) {
    this.families.set(input.familyId, { userId: input.userId, familyId: input.familyId, isCompromised: false });
    return input;
  }
  async findTokenFamilyByFamilyId(familyId: string) { return this.families.get(familyId); }
  async markTokenFamilyCompromised(familyId: string) {
    const family = this.families.get(familyId);
    if (family !== undefined) family.isCompromised = true;
    return family;
  }
  async updateTokenFamilyUsage(familyId: string) { return this.families.get(familyId); }
  async createAuditLog(input: Record<string, unknown>) { this.audits.push(input); return input; }
}

describe('TokenRotationService', () => {
  const tokenService = new TokenService(new TextEncoder().encode('access-secret-1234567890'), new TextEncoder().encode('refresh-secret-1234567890'));

  it('rotates a refresh token and returns a fresh pair', async () => {
    const repo = new FakeRepo();
    const redis = new FakeRedis();
    const subscriptionService = new FakeSubscriptionService();
    const rotation = new TokenRotationService(repo as unknown as IUserRepository, tokenService, subscriptionService as unknown as SubscriptionService, redis as any);

    const userId = randomUUID();
    const familyId = randomUUID();
    repo.users.set(userId, {
      id: userId,
      email: 'student@example.com',
      passwordHash: 'hash',
      role: 'student',
      platform: 'realtutorialhub',
      isActive: true,
      deletedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repo.platforms.set(userId, ['realtutorialhub', 'skillup']);
    await repo.createTokenFamily({ userId, familyId });
    const refreshToken = await tokenService.signRefreshToken(userId, familyId);
    await redis.set(`skillhubcore:refresh:${familyId}`, refreshToken);
    await repo.createSession({ userId, jwtFamily: familyId, platform: 'realtutorialhub', refreshTokenHash: refreshToken });

    const result = await rotation.rotate(refreshToken);

    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.user.platforms).toEqual(expect.arrayContaining(['realtutorialhub', 'skillup']));
  });

  it('marks a family compromised when a stale token is reused', async () => {
    const repo = new FakeRepo();
    const redis = new FakeRedis();
    const subscriptionService = new FakeSubscriptionService();
    const rotation = new TokenRotationService(repo as unknown as IUserRepository, tokenService, subscriptionService as unknown as SubscriptionService, redis as any);

    const userId = randomUUID();
    const familyId = randomUUID();
    repo.users.set(userId, {
      id: userId,
      email: 'student@example.com',
      passwordHash: 'hash',
      role: 'student',
      platform: 'realtutorialhub',
      isActive: true,
      deletedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repo.platforms.set(userId, ['realtutorialhub']);
    await repo.createTokenFamily({ userId, familyId });
    const refreshToken = await tokenService.signRefreshToken(userId, familyId);
    await redis.set(`skillhubcore:refresh:${familyId}`, 'other-token');
    await repo.createSession({ userId, jwtFamily: familyId, platform: 'realtutorialhub', refreshTokenHash: refreshToken });

    await expect(rotation.rotate(refreshToken)).rejects.toThrow('Session compromised');
    expect(repo.families.get(familyId)?.isCompromised).toBe(true);
  });
});
