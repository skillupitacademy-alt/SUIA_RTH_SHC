import { sql } from 'drizzle-orm';
import { date, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { paymentInstallmentStatusEnum } from './enums';
import { paymentPlans } from './payment-plans';

export const paymentInstallments = pgTable(
  'payment_installments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    planId: uuid('plan_id').notNull().references(() => paymentPlans.id, { onDelete: 'cascade' }),
    installmentNumber: integer('installment_number').notNull(),
    dueDate: date('due_date').notNull(),
    amount: integer('amount').notNull(),
    status: paymentInstallmentStatusEnum('status').notNull().default('due'),
    paymentRef: text('payment_ref'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxPaymentInstallmentsPlanDue: index('idx_payment_installments_plan_due').on(table.planId, table.dueDate),
    idxPaymentInstallmentsOverdue: index('idx_payment_installments_overdue')
      .on(table.status, table.dueDate)
      .where(sql`${table.status} = 'overdue'`),
    uniqPaymentInstallmentsPlanNumber: uniqueIndex('uniq_payment_installments_plan_number').on(
      table.planId,
      table.installmentNumber
    ),
  })
);
