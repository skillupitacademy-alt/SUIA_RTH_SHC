import { randomUUID } from 'crypto';

import { describe, expect, it, vi } from 'vitest';

import { PasswordService } from '../password.service';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { SubscriptionService } from '../../subscription/subscription.service';
import { SsoService } from '../sso/sso.service';
import type { PeoplePlatform, PeopleUserRole, IUserRepository, PeopleSubscriptionRecord, PeopleUserRecord } from '@quiz/types';

type SessionRecord = {
  userId: string;
  jwtFamily: string;
  platform: PeoplePlatform;
  revokedAt: Date | null;
};

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
  getPlanFeatures = vi.fn(async (planType: 'free' | 'pro' | 'enterprise') => {
    if (planType === 'free') {
      return ['tutorial.preview_only'];
    }
    return ['tutorial.full_access', 'ai_tutor'];
  });

  getFeatures = vi.fn(async (_userId: string) => ['tutorial.preview_only']);
  isFeatureEnabled = vi.fn(async (_userId: string, _feature: string) => false);
  onPaymentReceived = vi.fn(async () => undefined);
  invalidateFeaturesCache = vi.fn(async () => undefined);
}

class FakeRepo implements IUserRepository {
  readonly users = new Map<string, PeopleUserRecord & { passwordHash: string }>();
  readonly subscriptions = new Map<string, PeopleSubscriptionRecord>();
  readonly platforms = new Map<string, PeoplePlatform[]>();
  readonly sessions = new Map<string, SessionRecord>();
  readonly families = new Map<string, { userId: string; familyId: string; isCompromised: boolean; lastUsedAt: Date | null }>();
  readonly audits: Array<Record<string, unknown>> = [];

  withDb() {
    return this;
  }

  async transaction<T>(callback: (repo: IUserRepository) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async findByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email);
  }

  async findById(userId: string) {
    return this.users.get(userId);
  }

  async createUser(input: { email: string; passwordHash: string; role: PeopleUserRole; platform: PeoplePlatform }) {
    const userId = randomUUID();
    const user = {
      id: userId,
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
    this.users.set(userId, user);
    this.platforms.set(userId, [input.platform]);
    return user;
  }

  async createSubscription(input: { userId: string; planType: 'free' | 'pro' | 'enterprise'; features: string[] }) {
    const subscription = {
      id: randomUUID(),
      userId: input.userId,
      planType: input.planType,
      features: input.features,
      status: 'active' as const,
      startedAt: new Date(),
      expiresAt: null,
      deletedAt: null,
    };
    this.subscriptions.set(input.userId, subscription);
    return subscription;
  }

  async grantPlatformAccess(userId: string, platform: PeoplePlatform) {
    const current = this.platforms.get(userId) ?? [];
    if (!current.includes(platform)) {
      current.push(platform);
      this.platforms.set(userId, current);
    }
    return { userId, platform };
  }

  async revokePlatformAccess(userId: string, platform: PeoplePlatform) {
    const current = this.platforms.get(userId) ?? [];
    this.platforms.set(
      userId,
      current.filter((value) => value !== platform)
    );
    return { userId, platform };
  }

  async listPlatforms(userId: string) {
    return this.platforms.get(userId) ?? [];
  }

  async getActiveSubscription(userId: string) {
    return this.subscriptions.get(userId);
  }

  async createSession(input: { userId: string; jwtFamily: string; platform: PeoplePlatform; refreshTokenHash: string }) {
    this.sessions.set(input.jwtFamily, {
      userId: input.userId,
      jwtFamily: input.jwtFamily,
      platform: input.platform,
      revokedAt: null,
    });
    return input;
  }

  async findSessionByFamily(userId: string, familyId: string) {
    const session = this.sessions.get(familyId);
    if (session === undefined || session.userId !== userId) {
      return undefined;
    }
    return session;
  }

  async revokeSessionByFamily(userId: string, familyId: string) {
    const session = this.sessions.get(familyId);
    if (session !== undefined && session.userId === userId) {
      session.revokedAt = new Date();
    }
    return session;
  }

  async revokeAllSessions(userId: string) {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        session.revokedAt = new Date();
      }
    }
    return undefined;
  }

  async createTokenFamily(input: { userId: string; familyId: string }) {
    this.families.set(input.familyId, { userId: input.userId, familyId: input.familyId, isCompromised: false, lastUsedAt: null });
    return input;
  }

  async findTokenFamilyByFamilyId(familyId: string) {
    return this.families.get(familyId);
  }

  async markTokenFamilyCompromised(familyId: string) {
    const family = this.families.get(familyId);
    if (family !== undefined) {
      family.isCompromised = true;
    }
    return family;
  }

  async updateTokenFamilyUsage(familyId: string) {
    const family = this.families.get(familyId);
    if (family !== undefined) {
      family.lastUsedAt = new Date();
    }
    return family;
  }

  async createAuditLog(input: Record<string, unknown>) {
    this.audits.push(input);
    return input;
  }
}

const createService = () => {
  const repo = new FakeRepo();
  const redis = new FakeRedis();
  const subscriptionService = new FakeSubscriptionService();
  const ssoService = new SsoService(repo as unknown as IUserRepository);
  const tokenService = new TokenService(new TextEncoder().encode('access-secret-1234567890'), new TextEncoder().encode('refresh-secret-1234567890'));
  const passwordService = new PasswordService();
  const service = new AuthService(
    repo as unknown as IUserRepository as any,
    tokenService,
    passwordService,
    subscriptionService as unknown as SubscriptionService,
    ssoService,
    redis as any
  );
  return { service, repo, redis, tokenService, passwordService, subscriptionService, ssoService };
};

describe('AuthService', () => {
  it('registers a user atomically', async () => {
    const { service, repo, tokenService, subscriptionService } = createService();
    const result = await service.register({
      email: 'student@example.com',
      password: 'Password123!',
      platform: 'realtutorialhub',
      role: 'student',
    });

    expect(result.user.email).toBe('student@example.com');
    expect(repo.users.size).toBe(1);
    expect(repo.subscriptions.size).toBe(1);
    expect(repo.platforms.get(result.user.id)).toContain('realtutorialhub');
    expect(subscriptionService.getPlanFeatures).toHaveBeenCalledWith('free');

    const accessPayload = await tokenService.verifyAccessToken(result.accessToken);
    expect(accessPayload.roles).toEqual(['student']);
    expect(accessPayload.subscriptions).toEqual(['tutorial.preview_only']);
    expect(repo.audits[repo.audits.length - 1]?.action).toBe('register');
  });

  it('logs in and auto-grants new platform access', async () => {
    const { service, repo, tokenService, passwordService, subscriptionService } = createService();
    const passwordHash = await passwordService.hash('Password123!');
    const userId = randomUUID();
    repo.users.set(userId, {
      id: userId,
      email: 'student@example.com',
      passwordHash,
      role: 'student',
      platform: 'realtutorialhub',
      isActive: true,
      deletedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repo.platforms.set(userId, ['realtutorialhub']);
    repo.subscriptions.set(userId, {
      id: randomUUID(),
      userId,
      planType: 'free',
      features: ['tutorial.preview_only'],
      status: 'active',
      startedAt: new Date(),
      expiresAt: null,
      deletedAt: null,
    });

    const result = await service.login({
      email: 'student@example.com',
      password: 'Password123!',
      platform: 'skillup',
    });

    expect(result.user.platforms).toContain('skillup');
    expect(repo.platforms.get(userId)).toEqual(['realtutorialhub', 'skillup']);
    expect(subscriptionService.getFeatures).toHaveBeenCalledWith(userId);
    const accessPayload = await tokenService.verifyAccessToken(result.accessToken);
    expect(accessPayload.subscriptions).toEqual(['tutorial.preview_only']);
  });

  it('refreshes tokens and detects reuse of revoked refresh tokens', async () => {
    const { service, repo, subscriptionService } = createService();
    const passwordHash = await new PasswordService().hash('Password123!');
    const userId = randomUUID();
    repo.users.set(userId, {
      id: userId,
      email: 'student@example.com',
      passwordHash,
      role: 'student',
      platform: 'realtutorialhub',
      isActive: true,
      deletedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repo.platforms.set(userId, ['realtutorialhub']);
    repo.subscriptions.set(userId, {
      id: randomUUID(),
      userId,
      planType: 'free',
      features: ['tutorial.preview_only'],
      status: 'active',
      startedAt: new Date(),
      expiresAt: null,
      deletedAt: null,
    });

    const firstLogin = await service.login({
      email: 'student@example.com',
      password: 'Password123!',
      platform: 'realtutorialhub',
    });

    const rotated = await service.refresh(firstLogin.refreshToken);
    expect(rotated.refreshToken).not.toBe(firstLogin.refreshToken);
    expect(subscriptionService.getFeatures).toHaveBeenCalledWith(userId);

    await expect(service.refresh(firstLogin.refreshToken)).rejects.toThrow('Session compromised');
    expect([...repo.families.values()][0]?.isCompromised).toBe(true);
  });

  it('logs out a session and clears refresh token state', async () => {
    const { service, repo, redis } = createService();
    const passwordHash = await new PasswordService().hash('Password123!');
    const userId = randomUUID();
    repo.users.set(userId, {
      id: userId,
      email: 'student@example.com',
      passwordHash,
      role: 'student',
      platform: 'realtutorialhub',
      isActive: true,
      deletedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repo.platforms.set(userId, ['realtutorialhub']);
    repo.subscriptions.set(userId, {
      id: randomUUID(),
      userId,
      planType: 'free',
      features: ['tutorial.preview_only'],
      status: 'active',
      startedAt: new Date(),
      expiresAt: null,
      deletedAt: null,
    });
    const familyId = randomUUID();
    await repo.createTokenFamily({ userId, familyId });
    await repo.createSession({ userId, jwtFamily: familyId, platform: 'realtutorialhub', refreshTokenHash: 'refresh-token' });
    await redis.set(`skillhubcore:refresh:${familyId}`, 'refresh-token');

    await service.logout(userId, familyId);

    expect(await redis.get(`skillhubcore:refresh:${familyId}`)).toBeNull();
    expect(repo.audits[repo.audits.length - 1]?.action).toBe('logout');
  });
});
