/* istanbul ignore file */
import { integer, jsonb, pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { tutorialProgressStatusEnum } from './enums';
import type { CompletedBlockRecord } from '@quiz/types';

/**
 * Tutorial Navigation Progress
 * 
 * Phase 2.6: Per-navigation-node learner progress tracking
 * 
 * ARCHITECTURE:
 * - One row per (user_id, navigation_node_id) where deleted_at IS NULL
 * - Tracks individual learner interaction with specific navigation nodes
 * - Extends Phase 2.5 subtopic-level progress (does not replace)
 * 
 * IDENTITY SEPARATION:
 * - navigation_node_id: WHERE the learner is (sidebar node, URL identity)
 * - section_id: WHAT tutorial content section (tutorial_sections row)
 * - subtopic_id: curriculum hierarchy (domain > subject > topic > subtopic)
 * - completed_blocks: WHICH specific blocks completed (with versions)
 * 
 * TIME TRACKING:
 * - time_spent_active_sec: Active time (tab visible, user engaged)
 * - first_viewed_at: Initial content view timestamp
 * - last_viewed_at: Most recent view timestamp
 * 
 * SESSION TRACKING:
 * - visit_count: Total distinct visits/sessions
 * - revision_count: How many times learner returned after initial completion
 * - last_session_id: Most recent session identifier (JWT family ID or client session UUID)
 *   * Used to distinguish page refresh (same session) from new visit (different session)
 *   * Service layer compares incoming sessionId with lastSessionId to determine visit increment
 * 
 * COMPLETION:
 * - completed_blocks: Array of {blockId, blockVersion, completedAt} records
 * - Preserves version information for content revision tracking
 */
export const tutorialNavigationProgress = pgTable('tutorial_navigation_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Learner identity
  userId: uuid('user_id').notNull(),
  
  // Navigation identity (unique per learner)
  navigationNodeId: text('navigation_node_id').notNull(),
  
  // Content identity (resolved from navigation)
  sectionId: uuid('section_id'), // May be null if content not created yet
  subtopicId: uuid('subtopic_id').notNull(),
  
  // Progress state
  status: tutorialProgressStatusEnum('status').notNull().default('not_started'),
  
  // Block-level completion (stores blockId + blockVersion + timestamp)
  completedBlocks: jsonb('completed_blocks').$type<CompletedBlockRecord[]>().notNull().default([]),
  
  // Time tracking (active time, not wall-clock)
  timeSpentActiveSec: integer('time_spent_active_sec').notNull().default(0),
  
  // Session tracking
  visitCount: integer('visit_count').notNull().default(0),
  revisionCount: integer('revision_count').notNull().default(0),
  lastSessionId: text('last_session_id'), // JWT family ID or client session UUID for visit deduplication
  
  // Timestamps
  firstViewedAt: timestamp('first_viewed_at', { mode: 'date' }),
  lastViewedAt: timestamp('last_viewed_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  
  // Standard audit fields
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  // Primary learner + navigation identity (partial: only active records)
  // Follows project convention: see tutorial_sections.uqTutorialV2IdentityActive
  uqNavigationProgressUserNode: uniqueIndex('uq_navigation_progress_user_node')
    .on(table.userId, table.navigationNodeId)
    .where(sql`${table.deletedAt} IS NULL`),
  
  // Query by user (for learner dashboard)
  idxNavigationProgressUser: index('idx_navigation_progress_user')
    .on(table.userId),
  
  // Query by subtopic (for subtopic roll-up)
  idxNavigationProgressSubtopic: index('idx_navigation_progress_subtopic')
    .on(table.userId, table.subtopicId),
  
  // Query by navigation node (for analytics)
  idxNavigationProgressNode: index('idx_navigation_progress_node')
    .on(table.navigationNodeId),
  
  // Query by last viewed (for revision recommendations)
  idxNavigationProgressLastViewed: index('idx_navigation_progress_last_viewed')
    .on(table.userId, table.lastViewedAt),
}));
