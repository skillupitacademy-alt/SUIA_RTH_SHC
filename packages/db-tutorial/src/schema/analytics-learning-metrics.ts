/* istanbul ignore file */
/**
 * Learning Analytics - GAP 5 REMEDIATION
 * Phase 1 P0 Foundation - Database Governance
 * 
 * Educational and engagement metrics for learning optimization
 */

import { integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tutorialSections } from './tutorial-sections';
import { tutorialSubsections } from './tutorial-subsections';
import { brandEnum } from './enums-modular';

/**
 * Tutorial Learning Metrics
 * Tracks educational performance at section level
 */
export const tutorialLearningMetrics = pgTable('tutorial_learning_metrics', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  hour: integer('hour'), // 0-23, null for daily aggregation
  aggregationLevel: text('aggregation_level').notNull(), // hourly, daily, weekly, monthly
  
  // Content Reference
  sectionId: uuid('section_id')
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  sectionType: text('section_type').notNull(),
  
  // Brand Dimension
  brandId: brandEnum('brand_id').notNull(),
  
  // Engagement Metrics
  totalViews: integer('total_views').notNull().default(0),
  uniqueUsers: integer('unique_users').notNull().default(0),
  averageTimeSpent: integer('average_time_spent').notNull().default(0), // seconds
  completionRate: integer('completion_rate').notNull().default(0), // 0-100
  
  // Learning Progression
  startedCount: integer('started_count').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  abandonedCount: integer('abandoned_count').notNull().default(0),
  dropOffPoints: jsonb('drop_off_points').$type<{
    subsectionId: string;
    dropOffRate: number;
  }[]>(),
  
  // Interaction Metrics
  codeExecutions: integer('code_executions').notNull().default(0),
  practiceAttempts: integer('practice_attempts').notNull().default(0),
  quizAttempts: integer('quiz_attempts').notNull().default(0),
  averageQuizScore: integer('average_quiz_score'), // 0-100
  
  // Feedback Metrics
  thumbsUp: integer('thumbs_up').notNull().default(0),
  thumbsDown: integer('thumbs_down').notNull().default(0),
  reportedIssues: integer('reported_issues').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint
  uqLearningMetricsDateHourSectionBrand: uniqueIndex('uq_learning_metrics_date_hour_section_brand').on(
    table.date,
    table.hour,
    table.sectionId,
    table.brandId,
    table.aggregationLevel
  ),
  // Indexes
  idxLearningSection: index('idx_learning_section').on(table.sectionId),
  idxLearningBrand: index('idx_learning_brand').on(table.brandId),
  idxLearningDate: index('idx_learning_date').on(table.date),
}));

/**
 * Subsection Engagement Metrics
 * Granular tracking at subsection level
 */
export const subsectionEngagementMetrics = pgTable('subsection_engagement_metrics', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  hour: integer('hour'),
  aggregationLevel: text('aggregation_level').notNull(),
  
  // Content Reference
  subsectionId: uuid('subsection_id')
    .references(() => tutorialSubsections.id, { onDelete: 'cascade' }),
  subsectionType: text('subsection_type').notNull(),
  
  // Brand Dimension
  brandId: brandEnum('brand_id').notNull(),
  
  // Engagement Metrics
  totalViews: integer('total_views').notNull().default(0),
  uniqueUsers: integer('unique_users').notNull().default(0),
  averageTimeSpent: integer('average_time_spent').notNull().default(0),
  completionRate: integer('completion_rate').notNull().default(0),
  
  // Interaction Depth
  scrollDepth: integer('scroll_depth').notNull().default(0), // 0-100
  interactionCount: integer('interaction_count').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint
  uqSubsectionMetricsDateHourSubsectionBrand: uniqueIndex('uq_subsection_metrics_date_hour_subsection_brand').on(
    table.date,
    table.hour,
    table.subsectionId,
    table.brandId,
    table.aggregationLevel
  ),
  // Indexes
  idxSubsectionEngagement: index('idx_subsection_engagement').on(table.subsectionId),
  idxSubsectionBrand: index('idx_subsection_brand').on(table.brandId),
}));

/**
 * Type inference for TypeScript
 */
export type TutorialLearningMetrics = typeof tutorialLearningMetrics.$inferSelect;
export type NewTutorialLearningMetrics = typeof tutorialLearningMetrics.$inferInsert;
export type SubsectionEngagementMetrics = typeof subsectionEngagementMetrics.$inferSelect;
export type NewSubsectionEngagementMetrics = typeof subsectionEngagementMetrics.$inferInsert;
