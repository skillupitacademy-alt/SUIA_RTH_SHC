import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Durable event outbox / publication-intent ledger (`event_outbox`)
 * Supports transactional domain persistence + recoverable downstream event publication (Sol A2 / L3 / D7).
 */
export const eventOutbox = pgTable(
  'event_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: varchar('tenant_id', { length: 50 }).notNull(),
    eventType: varchar('event_type', { length: 120 }).notNull(),
    eventId: uuid('event_id').notNull(),
    aggregateId: varchar('aggregate_id', { length: 180 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    envelope: jsonb('envelope').$type<Record<string, unknown> | null>(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    attemptCount: integer('attempt_count').notNull().default(0),
    ownerToken: varchar('owner_token', { length: 120 }),
    leaseExpiresAt: timestamp('lease_expires_at'),
    lastError: text('last_error'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantEventAggregateUnq: uniqueIndex('event_outbox_tenant_event_aggregate_unq').on(
      table.tenantId,
      table.eventType,
      table.aggregateId
    ),
    eventIdUnq: uniqueIndex('event_outbox_event_id_unq').on(table.eventId),
    statusIdx: index('event_outbox_status_idx').on(table.tenantId, table.status, table.createdAt),
  })
);

export type EventOutboxRow = typeof eventOutbox.$inferSelect;
export type NewEventOutboxRow = typeof eventOutbox.$inferInsert;
