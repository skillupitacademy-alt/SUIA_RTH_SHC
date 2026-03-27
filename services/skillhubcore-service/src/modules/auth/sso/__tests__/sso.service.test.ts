import { randomUUID } from 'crypto';

import { describe, expect, it } from 'vitest';

import type { PeoplePlatform, IUserRepository } from '@quiz/types';

import { SsoService } from '../sso.service';

class FakeRepo implements IUserRepository {
  readonly users = new Map<string, { id: string; email: string }>();
  readonly subscriptions = new Map<string, { id: string; userId: string }>();
  readonly platforms = new Map<string, Array<{ platform: PeoplePlatform; deletedAt: Date | null }>>();

  withDb() {
    return this;
  }

  async transaction<T>(callback: (repo: IUserRepository) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async findByEmail() {
    return undefined;
  }

  async findById() {
    return undefined;
  }

  async createUser() {
    const user = { id: randomUUID(), email: 'user@example.com' };
    this.users.set(user.id, user);
    return {
      ...user,
      passwordHash: 'hash',
      role: 'student',
      platform: 'realtutorialhub',
      isActive: true,
      deletedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  async createSubscription() {
    return {
      id: randomUUID(),
      userId: randomUUID(),
      planType: 'free',
      features: [],
      status: 'active',
      startedAt: new Date(),
      expiresAt: null,
      deletedAt: null,
    } as any;
  }

  async grantPlatformAccess(userId: string, platform: PeoplePlatform) {
    const rows = this.platforms.get(userId) ?? [];
    const existing = rows.find((row) => row.platform === platform);
    if (existing === undefined) {
      rows.push({ platform, deletedAt: null });
    } else {
      existing.deletedAt = null;
    }
    this.platforms.set(userId, rows);
    return { id: randomUUID(), userId, platform };
  }

  async revokePlatformAccess(userId: string, platform: PeoplePlatform) {
    const rows = this.platforms.get(userId) ?? [];
    const existing = rows.find((row) => row.platform === platform && row.deletedAt === null);
    if (existing !== undefined) {
      existing.deletedAt = new Date();
    }
    this.platforms.set(userId, rows);
    return { userId, platform };
  }

  async listPlatforms(userId: string) {
    return (this.platforms.get(userId) ?? [])
      .filter((row) => row.deletedAt === null)
      .map((row) => row.platform);
  }

  async getActiveSubscription() {
    return undefined;
  }

  async createSession() {
    return {};
  }

  async findSessionByFamily() {
    return undefined;
  }

  async revokeSessionByFamily() {
    return undefined;
  }

  async revokeAllSessions() {
    return undefined;
  }

  async createTokenFamily() {
    return {};
  }

  async findTokenFamilyByFamilyId() {
    return undefined;
  }

  async markTokenFamilyCompromised() {
    return undefined;
  }

  async updateTokenFamilyUsage() {
    return undefined;
  }

  async createAuditLog() {
    return {};
  }
}

describe('SsoService', () => {
  it('grants, lists, and revokes platform access', async () => {
    const repo = new FakeRepo();
    const service = new SsoService(repo as unknown as IUserRepository);
    const userId = randomUUID();

    await service.grantPlatformAccess(userId, 'realtutorialhub');
    await service.grantPlatformAccess(userId, 'skillup');
    expect(await service.getUserPlatforms(userId)).toEqual(['realtutorialhub', 'skillup']);

    await service.revokePlatformAccess(userId, 'skillup');
    expect(await service.getUserPlatforms(userId)).toEqual(['realtutorialhub']);

    await service.grantPlatformAccess(userId, 'skillup');
    expect(await service.getUserPlatforms(userId)).toEqual(['realtutorialhub', 'skillup']);
  });
});
