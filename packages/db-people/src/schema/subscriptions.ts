import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { subscriptionPlanEnum, subscriptionStatusEnum } from './enums';
import { users } from './users';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  planType: subscriptionPlanEnum('plan_type').notNull().default('free'),
  features: jsonb('features').$type<string[]>().notNull().default([]),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
});
