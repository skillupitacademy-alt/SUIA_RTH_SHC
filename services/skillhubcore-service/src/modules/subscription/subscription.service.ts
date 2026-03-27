import { logger } from '@/lib/logger';
import { cache as defaultCache } from '@/lib/cache';

import { SubscriptionRepository, type SubscriptionPlan } from './subscription.repository';

const FREE_PLAN_FEATURES = ['tutorial.preview_only'];
const FEATURE_CACHE_PREFIX = 'skillhubcore:subscription-features';

type CacheLike = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
};

export interface SubscriptionSnapshot {
  planType: SubscriptionPlan;
  features: string[];
  status: 'active' | 'cancelled' | 'expired';
  startedAt: Date;
  expiresAt: Date | null;
  cachedAt: Date | null;
}

export interface PaymentReceivedInput {
  userId: string;
  planType: SubscriptionPlan;
  features?: string[];
}

export class SubscriptionService {
  constructor(
    private readonly repo = new SubscriptionRepository(),
    private readonly cache: CacheLike = defaultCache
  ) {}

  private cacheKey(userId: string): string {
    return `${FEATURE_CACHE_PREFIX}:${userId}`;
  }

  async getPlanFeatures(planType: SubscriptionPlan): Promise<string[]> {
    if (planType === 'free') {
      return [...FREE_PLAN_FEATURES];
    }

    const plan = await this.repo.findPlanByName(planType);
    if (plan === undefined) {
      return [];
    }

    const detailedFeatures = await this.repo.listPlanFeatures(plan.id);
    if (detailedFeatures.length > 0) {
      return detailedFeatures.map((feature) => feature.featureKey);
    }

    return Array.isArray(plan.features) ? plan.features : [];
  }

  async getActivePlan(userId: string): Promise<SubscriptionSnapshot | null> {
    const subscription = await this.repo.findActiveSubscription(userId);
    if (subscription === undefined) {
      return null;
    }

    const features = subscription.features.length > 0 ? subscription.features : await this.getPlanFeatures(subscription.planType);
    const cachedRow = await this.repo.setCachedFeatures(userId, features);

    await this.cache.set(this.cacheKey(userId), JSON.stringify(features));

    return {
      planType: subscription.planType,
      features,
      status: subscription.status,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      cachedAt: cachedRow.cachedAt,
    };
  }

  async getFeatures(userId: string): Promise<string[]> {
    const cached = await this.cache.get(this.cacheKey(userId));
    if (typeof cached === 'string' && cached.trim().length > 0) {
      try {
        const parsed = JSON.parse(cached) as unknown;
        if (Array.isArray(parsed) && parsed.every((feature) => typeof feature === 'string')) {
          return parsed;
        }
      } catch {
        // Fall back to database-backed resolution below.
      }
    }

    const subscription = await this.repo.findActiveSubscription(userId);
    const features = subscription?.features.length
      ? subscription.features
      : subscription !== undefined
        ? await this.getPlanFeatures(subscription.planType)
        : [...FREE_PLAN_FEATURES];

    await this.cache.set(this.cacheKey(userId), JSON.stringify(features));
    await this.repo.setCachedFeatures(userId, features);
    return features;
  }

  async isFeatureEnabled(userId: string, feature: string): Promise<boolean> {
    const features = await this.getFeatures(userId);
    return features.includes(feature);
  }

  async onPaymentReceived(input: PaymentReceivedInput): Promise<void> {
    const features = input.features ?? (await this.getPlanFeatures(input.planType));
    await this.repo.upsertActiveSubscription(input.userId, input.planType, features);
    await this.repo.invalidateFeaturesCache(input.userId);
    await this.cache.del(this.cacheKey(input.userId));
    await this.repo.setCachedFeatures(input.userId, features);
    await this.cache.set(this.cacheKey(input.userId), JSON.stringify(features));
    logger.info({ userId: input.userId, planType: input.planType, featureCount: features.length }, 'subscription updated');
  }

  async invalidateFeaturesCache(userId: string): Promise<void> {
    await this.repo.invalidateFeaturesCache(userId);
    await this.cache.del(this.cacheKey(userId));
  }
}
