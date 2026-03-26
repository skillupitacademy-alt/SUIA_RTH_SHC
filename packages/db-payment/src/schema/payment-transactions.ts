import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { paymentTransactionGatewayEnum, paymentTransactionStatusEnum } from './enums';
import { paymentInstallments } from './payment-installments';

export const paymentTransactions = pgTable(
  'payment_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    installmentId: uuid('installment_id').notNull().references(() => paymentInstallments.id, { onDelete: 'cascade' }),
    paymentRef: text('payment_ref').notNull(),
    gateway: paymentTransactionGatewayEnum('gateway').notNull().default('razorpay'),
    status: paymentTransactionStatusEnum('status').notNull().default('created'),
    amount: integer('amount').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    uniqPaymentTransactionsPaymentRef: uniqueIndex('uniq_payment_transactions_payment_ref').on(table.paymentRef),
    idxPaymentTransactionsGateway: index('idx_payment_transactions_gateway').on(table.gateway, table.createdAt),
  })
);
