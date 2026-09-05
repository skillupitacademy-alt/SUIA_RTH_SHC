/* istanbul ignore file */
import { integer, pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Block Learning State - Phase 4 ILS
 * 
 * Per-block learner progress and telemetry
 * 
 * IDENTITY: (userId, navigationNodeId, blockId, blockVersion)
 * - userId: Learner identity (already brand-scoped via existing identity model)
 * - navigationNodeId: Page/navigation context (sidebar node, URL identity)
 * - blockId: Block instance UUID (from TutorialDocument canonical block identity)
 * - blockVersion: Block content version (D1, C1, S1, etc.)
 * 
 * TELEMETRY:
 * - visitCount: Block-level visit tracking
 * - revisionCount: Return visits after completion
 * - activeTimeSec: Measured active engagement time (independent from page time)
 * - expectedTimeSec: Authored expected time from published document (nullable)
 * 
 * TIMESTAMPS:
 * - firstViewedAt: First block observation
 * - lastViewedAt: Most recent observation
 * - completedAt: Denormalized completion timestamp
 *   (authoritative source: tutorial_navigation_progress.completed_blocks)
 * 
 * ARCHITECTURE:
 * - Independent from page-level progress (separate measurement scopes)
 * - Generic (works for any block type via canonical identity)
 * - Session-agnostic (visit logic managed by service layer, not stored here)
 * - Cross-page blocks have separate telemetry per navigationNodeId
 */
export const blockLearningState = pgTable('block_learning_state', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Learner Identity
  userId: uuid('user_id').notNull(),
  
  // Block Identity (scoped to navigation node)
  navigationNodeId: text('navigation_node_id').notNull(),
  blockId: text('block_id').notNull(),  // UUID stored as text (canonical block identity)
  blockVersion: text('block_version').notNull(),  // 'D1', 'C1', 'S1', etc.
  
  // Telemetry Counters
  visitCount: integer('visit_count').notNull().default(0),
  revisionCount: integer('revision_count').notNull().default(0),
  activeTimeSec: integer('active_time_sec').notNull().default(0),
  
  // Expected Time (authored metadata from published document)
  expectedTimeSec: integer('expected_time_sec'),  // Nullable - may not exist for all blocks
  
  // Timestamps
  firstViewedAt: timestamp('first_viewed_at', { mode: 'date' }),
  lastViewedAt: timestamp('last_viewed_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),  // Denormalized from completed_blocks
  
  // Audit Fields
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  // Unique block identity (partial - active records only, following repository soft-delete convention)
  uqBlockLearningStateIdentity: uniqueIndex('uq_block_learning_state_identity')
    .on(table.userId, table.navigationNodeId, table.blockId, table.blockVersion)
    .where(sql`${table.deletedAt} IS NULL`),
  
  // Query by user (learner dashboard)
  idxBlockLearningStateUser: index('idx_block_learning_state_user')
    .on(table.userId),
  
  // Query by navigation node (page-level aggregation)
  idxBlockLearningStateNode: index('idx_block_learning_state_node')
    .on(table.userId, table.navigationNodeId),
  
  // Query by block (cross-page analytics)
  idxBlockLearningStateBlock: index('idx_block_learning_state_block')
    .on(table.blockId, table.blockVersion),
  
  // Query by last viewed (recommendations)
  idxBlockLearningStateLastViewed: index('idx_block_learning_state_last_viewed')
    .on(table.userId, table.lastViewedAt),
}));

