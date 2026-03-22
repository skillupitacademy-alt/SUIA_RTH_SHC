import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const authAuditLog = pgTable('auth_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  platform: text('platform'),
  ip: text('ip'),
  success: boolean('success'),
  metadata: jsonb('metadata').$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});
