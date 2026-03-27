import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { subscriptionFeatureKeyEnum } from './enums';
import { users } from './users';

export const subscriptionPlans = pgTable(
  'subscription_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    features: jsonb('features').$type<string[]>().notNull().default([]),
    priceMonthly: integer('price_monthly').notNull().default(0),
    priceYearly: integer('price_yearly').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxSubscriptionPlansActive: index('idx_subscription_plans_active').on(table.isActive, table.name),
  })
);

export const subscriptionFeatures = pgTable(
  'subscription_features',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    planId: uuid('plan_id').notNull().references(() => subscriptionPlans.id, { onDelete: 'cascade' }),
    featureKey: subscriptionFeatureKeyEnum('feature_key').notNull(),
    limitValue: integer('limit_value'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxSubscriptionFeaturesPlan: index('idx_subscription_features_plan').on(table.planId, table.featureKey),
  })
);

export const userFeaturesCache = pgTable(
  'user_features_cache',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    features: jsonb('features').$type<string[]>().notNull().default([]),
    cachedAt: timestamp('cached_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxUserFeaturesCacheUser: index('idx_user_features_cache_user').on(table.userId, table.cachedAt),
  })
);
