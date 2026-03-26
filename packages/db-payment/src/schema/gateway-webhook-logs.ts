import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { gatewayWebhookStatusEnum, paymentTransactionGatewayEnum } from './enums';

export const gatewayWebhookLogs = pgTable(
  'gateway_webhook_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    paymentRef: text('payment_ref').notNull(),
    gateway: paymentTransactionGatewayEnum('gateway').notNull(),
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),
    status: gatewayWebhookStatusEnum('status').notNull().default('received'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxGatewayWebhookLogsPaymentRef: index('idx_gateway_webhook_logs_payment_ref').on(table.paymentRef),
    idxGatewayWebhookLogsStatusCreatedAt: index('idx_gateway_webhook_logs_status_created_at').on(
      table.status,
      table.createdAt
    ),
  })
);
