/**
 * Phase D-2: Block Telemetry Event Deduplication
 * 
 * Ensures idempotent active-time delivery:
 * - One logical telemetry event = one active-time increment
 * - Duplicate HTTP requests safely deduplicated
 * - Event identity stable across retries
 * 
 * ARCHITECTURE:
 * - Event table independent of block_learning_state lifecycle
 * - Global uniqueness on event_id (client-generated UUID)
 * - Survives soft-delete/recreation of learning state
 * 
 * LIFECYCLE:
 * - Browser generates eventId per logical increment
 * - Server claims event atomically with time accumulation
 * - Duplicate claims return idempotent success
 * - Event history retained for audit (cleanup via background job)
 * 
 * TYPE CONTRACT (verified against actual project schema):
 * - user_id: UUID (NOT TEXT)
 * - navigation_node_id: TEXT (NOT UUID)
 * - timestamps: TIMESTAMP WITHOUT TIME ZONE (NOT TIMESTAMPTZ)
 */

import { pgTable, uuid, text, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const blockTelemetryEvents = pgTable('block_telemetry_events', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Event Identity (client-generated UUID, stable across HTTP retries)
  eventId: text('event_id').notNull(),
  
  // Block Identity (scoped to block_learning_state identity)
  // CRITICAL: Types verified against block_learning_state actual schema
  userId: uuid('user_id').notNull(),  // ✅ UUID (matches block_learning_state.user_id)
  navigationNodeId: text('navigation_node_id').notNull(),  // ✅ TEXT (matches block_learning_state.navigation_node_id)
  blockId: text('block_id').notNull(),
  blockVersion: text('block_version').notNull(),
  
  // Telemetry Payload
  // CRITICAL: This is an INCREMENT (delta), not cumulative
  // Validation: 0 <= activeTimeSec <= 600 (enforced at service layer)
  activeTimeSec: integer('active_time_sec').notNull(),
  
  // Audit (matches project timestamp convention - no timezone)
  processedAt: timestamp('processed_at', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Global uniqueness on event_id (primary deduplication constraint)
  uniqueEventId: uniqueIndex('uq_block_telemetry_event_id').on(table.eventId),
  
  // Lookup by block identity (for debugging/audit queries)
  blockLookupIdx: index('idx_block_telemetry_events_block_lookup').on(
    table.userId,
    table.navigationNodeId,
    table.blockId,
    table.blockVersion,
    table.processedAt
  ),
  
  // Cleanup index (for background job to prune old events)
  cleanupIdx: index('idx_block_telemetry_events_cleanup').on(table.processedAt),
}));

export type BlockTelemetryEvent = typeof blockTelemetryEvents.$inferSelect;
export type BlockTelemetryEventInsert = typeof blockTelemetryEvents.$inferInsert;
