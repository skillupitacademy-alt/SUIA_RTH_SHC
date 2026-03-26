import { date, integer, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { paymentInstallmentStatusEnum } from './enums';
import { users } from './users';

export const paymentInstallments = pgTable(
  'payment_installments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    dueDate: date('due_date').notNull(),
    amount: integer('amount').notNull(),
    status: paymentInstallmentStatusEnum('status').notNull().default('due'),
    paymentRef: text('payment_ref'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxPaymentInstallmentsStudent: index('idx_payment_installments_student').on(table.studentUserId, table.dueDate),
  })
);
