/* istanbul ignore file */
/**
 * Content Review Queue - Human Approval Workflow
 * Phase 1 P0 Foundation - Database Governance
 * 
 * Manages human review and approval of AI-generated content
 */

import { integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { reviewStatusEnum, priorityLevelEnum } from './enums-modular';

/**
 * Content Review Queue Table
 * Human review workflow for AI-generated content
 */
export const contentReviewQueue = pgTable('content_review_queue', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Content References
  orchestrationId: uuid('orchestration_id').notNull(),
  sectionId: uuid('section_id').notNull(),
  
  // Assignment
  assignedTo: uuid('assigned_to'),
  assignedAt: timestamp('assigned_at', { mode: 'date' }),
  
  // Review Status
  status: reviewStatusEnum('status').notNull().default('pending_review'),
  
  // Review Feedback
  reviewComments: text('review_comments'),
  rejectionReason: text('rejection_reason'),
  suggestedChanges: jsonb('suggested_changes').$type<{
    field: string;
    currentValue: string;
    suggestedValue: string;
    reason: string;
  }[]>(),
  
  // Reviewer Assessment
  reviewerQualityScore: integer('reviewer_quality_score'), // 0-100
  reviewerFlags: jsonb('reviewer_flags').$type<string[]>(),
  
  // Timing
  reviewStartedAt: timestamp('review_started_at', { mode: 'date' }),
  reviewCompletedAt: timestamp('review_completed_at', { mode: 'date' }),
  
  // Priority
  priority: priorityLevelEnum('priority').notNull().default('normal'),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  idxReviewQueueStatus: index('idx_review_queue_status').on(table.status),
  idxReviewQueueAssigned: index('idx_review_queue_assigned').on(table.assignedTo),
  idxReviewQueuePriority: index('idx_review_queue_priority').on(table.priority, table.status),
}));

/**
 * Type inference for TypeScript
 */
export type ContentReviewQueue = typeof contentReviewQueue.$inferSelect;
export type NewContentReviewQueue = typeof contentReviewQueue.$inferInsert;
