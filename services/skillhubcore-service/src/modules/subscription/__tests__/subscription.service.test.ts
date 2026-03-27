import { randomUUID } from 'crypto';

import { describe, expect, it, vi } from 'vitest';

import { SubscriptionService } from '../subscription.service';

type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

class FakeCache {
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

class FakeRepository {
  activeSubscription: {
    id: string;
    userId: string;
    planType: SubscriptionPlan;
    features: string[];
    status: 'active' | 'cancelled' | 'expired';
    startedAt: Date;
    expiresAt: Date | null;
    deletedAt: Date | null;
  } | undefined;

  planRows = new Map<SubscriptionPlan, { id: string; name: SubscriptionPlan; features: string[]; isActive: boolean }>();
  featureRows = new Map<string, Array<{ featureKey: string; limitValue: number | null }>>();
  cachedRows = new Map<string, { id: string; userId: string; features: string[]; cachedAt: Date }>();

  async findActiveSubscription(userId: string) {
    return this.activeSubscription?.userId === userId ? this.activeSubscription : undefined;
  }

  async findPlanByName(planType: SubscriptionPlan) {
    return this.planRows.get(planType);
  }

  async listPlanFeatures(planId: string) {
    return this.featureRows.get(planId) ?? [];
  }

  async getCachedFeatures(userId: string) {
    return this.cachedRows.get(userId);
  }

  async setCachedFeatures(userId: string, features: string[]) {
    const row = {
      id: randomUUID(),
      userId,
      features,
      cachedAt: new Date(),
    };
    this.cachedRows.set(userId, row);
    return row;
  }

  async invalidateFeaturesCache(userId: string) {
    this.cachedRows.delete(userId);
  }

  async upsertActiveSubscription(userId: string, planType: SubscriptionPlan, features: string[]) {
    const row = {
      id: randomUUID(),
      userId,
      planType,
      features,
      status: 'active' as const,
      startedAt: new Date(),
      expiresAt: null,
      deletedAt: null,
    };
    this.activeSubscription = row;
    return row;
  }
}

const createService = () => {
  const repo = new FakeRepository();
  const cache = new FakeCache();
  const service = new SubscriptionService(repo as never, cache as never);
  return { service, repo, cache };
};

describe('SubscriptionService', () => {
  it('returns free plan features when no subscription exists', async () => {
    const { service, cache, repo } = createService();

    await expect(service.getFeatures('user-1')).resolves.toEqual(['tutorial.preview_only']);
    expect(cache.set).toHaveBeenCalledTimes(1);
    expect(repo.cachedRows.size).toBe(1);
  });

  it('returns cached plan features for active subscriptions', async () => {
    const { service, cache, repo } = createService();
    repo.activeSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      planType: 'pro',
      features: ['ai_tutor', 'live_sessions'],
      status: 'active',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: null,
      deletedAt: null,
    };

    await expect(service.getActivePlan('user-1')).resolves.toMatchObject({
      planType: 'pro',
      features: ['ai_tutor', 'live_sessions'],
      status: 'active',
    });
    expect(cache.set).toHaveBeenCalledWith('skillhubcore:subscription-features:user-1', JSON.stringify(['ai_tutor', 'live_sessions']));
  });

  it('uses detailed plan rows when subscription features are empty', async () => {
    const { service, repo } = createService();
    repo.planRows.set('enterprise', {
      id: 'plan-1',
      name: 'enterprise',
      features: [],
      isActive: true,
    });
    repo.featureRows.set('plan-1', [
      { featureKey: 'certificate', limitValue: null },
      { featureKey: 'placement_matching', limitValue: null },
    ]);

    await expect(service.getPlanFeatures('enterprise')).resolves.toEqual(['certificate', 'placement_matching']);
  });

  it('upserts a payment result and invalidates cached features', async () => {
    const { service, cache, repo } = createService();
    repo.activeSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      planType: 'free',
      features: ['tutorial.preview_only'],
      status: 'active',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: null,
      deletedAt: null,
    };
    await repo.setCachedFeatures('user-1', ['tutorial.preview_only']);
    await cache.set('skillhubcore:subscription-features:user-1', JSON.stringify(['tutorial.preview_only']));

    await service.onPaymentReceived({
      userId: 'user-1',
      planType: 'pro',
      features: ['tutorial.full_access', 'ai_tutor'],
    });

    expect(repo.activeSubscription?.planType).toBe('pro');
    expect(repo.activeSubscription?.features).toEqual(['tutorial.full_access', 'ai_tutor']);
    expect(cache.del).toHaveBeenCalledWith('skillhubcore:subscription-features:user-1');
    expect(repo.cachedRows.get('user-1')?.features).toEqual(['tutorial.full_access', 'ai_tutor']);
  });
});
