import { index, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { paymentPlanStatusEnum, paymentPlanTypeEnum } from './enums';

export const paymentPlans = pgTable(
  'payment_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    status: paymentPlanStatusEnum('status').notNull().default('active'),
    planType: paymentPlanTypeEnum('plan_type').notNull().default('installment'),
    totalAmount: integer('total_amount').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxPaymentPlansUser: index('idx_payment_plans_user').on(table.userId),
    idxPaymentPlansStatus: index('idx_payment_plans_status').on(table.status),
  })
);
