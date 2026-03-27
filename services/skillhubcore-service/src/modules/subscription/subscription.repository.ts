import { and, desc, eq, isNull } from 'drizzle-orm';

import { withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db';
import type { PeopleSubscriptionRecord } from '@quiz/types';

import { db, schema } from '@/lib/db';

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionPlanRow = typeof schema.subscriptionPlans.$inferSelect;
export type SubscriptionFeatureRow = typeof schema.subscriptionFeatures.$inferSelect;
export type UserFeaturesCacheRow = typeof schema.userFeaturesCache.$inferSelect;

export class SubscriptionRepository {
  constructor(private readonly dbClient = db) {}

  async findActiveSubscription(userId: string): Promise<PeopleSubscriptionRecord | undefined> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.subscriptions)
        .where(and(eq(schema.subscriptions.userId, userId), eq(schema.subscriptions.status, 'active'), isNull(schema.subscriptions.deletedAt)))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'skillhubcore.subscriptions.findActive'
    );
    return rows[0] as PeopleSubscriptionRecord | undefined;
  }

  async findPlanByName(planType: SubscriptionPlan): Promise<SubscriptionPlanRow | undefined> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.subscriptionPlans)
        .where(and(eq(schema.subscriptionPlans.name, planType), eq(schema.subscriptionPlans.isActive, true)))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'skillhubcore.subscription_plans.findByName'
    );
    return rows[0] as SubscriptionPlanRow | undefined;
  }

  async listPlanFeatures(planId: string): Promise<Array<{ featureKey: string; limitValue: number | null }>> {
    const rows = await withTimeout(
      this.dbClient
        .select({ featureKey: schema.subscriptionFeatures.featureKey, limitValue: schema.subscriptionFeatures.limitValue })
        .from(schema.subscriptionFeatures)
        .where(eq(schema.subscriptionFeatures.planId, planId)),
      STANDARD_QUERY_TIMEOUT,
      'skillhubcore.subscription_features.listByPlan'
    );
    return rows.map((row) => ({ featureKey: row.featureKey, limitValue: row.limitValue ?? null }));
  }

  async getCachedFeatures(userId: string): Promise<UserFeaturesCacheRow | undefined> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.userFeaturesCache)
        .where(eq(schema.userFeaturesCache.userId, userId))
        .orderBy(desc(schema.userFeaturesCache.cachedAt))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'skillhubcore.user_features_cache.findByUser'
    );
    return rows[0] as UserFeaturesCacheRow | undefined;
  }

  async setCachedFeatures(userId: string, features: string[]): Promise<UserFeaturesCacheRow> {
    const existing = await this.getCachedFeatures(userId);
    if (existing !== undefined) {
      const [row] = await withTimeout(
        this.dbClient
          .update(schema.userFeaturesCache)
          .set({ features, cachedAt: new Date() })
          .where(eq(schema.userFeaturesCache.id, existing.id))
          .returning(),
        STANDARD_QUERY_TIMEOUT,
        'skillhubcore.user_features_cache.update'
      );
      return row as UserFeaturesCacheRow;
    }

    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.userFeaturesCache)
        .values({
          userId,
          features,
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'skillhubcore.user_features_cache.create'
    );
    return row as UserFeaturesCacheRow;
  }

  async invalidateFeaturesCache(userId: string): Promise<void> {
    await withTimeout(
      this.dbClient.delete(schema.userFeaturesCache).where(eq(schema.userFeaturesCache.userId, userId)),
      STANDARD_QUERY_TIMEOUT,
      'skillhubcore.user_features_cache.delete'
    );
  }

  async upsertActiveSubscription(userId: string, planType: SubscriptionPlan, features: string[]): Promise<PeopleSubscriptionRecord> {
    const existing = await this.findActiveSubscription(userId);
    if (existing !== undefined) {
      const [row] = await withTimeout(
        this.dbClient
          .update(schema.subscriptions)
          .set({
            planType,
            features,
            status: 'active',
            deletedAt: null,
          })
          .where(eq(schema.subscriptions.id, existing.id))
          .returning(),
        STANDARD_QUERY_TIMEOUT,
        'skillhubcore.subscriptions.update'
      );
      return row as PeopleSubscriptionRecord;
    }

    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.subscriptions)
        .values({
          userId,
          planType,
          features,
          status: 'active',
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'skillhubcore.subscriptions.create'
    );
    return row as PeopleSubscriptionRecord;
  }
}
