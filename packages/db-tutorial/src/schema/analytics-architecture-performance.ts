/* istanbul ignore file */
/**
 * Architecture Performance Analytics - GAP 5 REMEDIATION
 * Phase 1 P0 Foundation - Database Governance
 * 
 * Tracks performance of educational/UI architectures and prompt templates
 */

import { integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { educationalArchitectures } from './educational-architectures';
import { uiArchitectures } from './ui-architectures';
import { promptTemplates } from './prompt-templates';
import { brandEnum } from './enums-modular';

/**
 * Educational Architecture Performance Metrics
 * Tracks learning outcomes by architecture template
 */
export const educationalArchitecturePerformance = pgTable('educational_architecture_performance', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  aggregationLevel: text('aggregation_level').notNull(),
  
  // Architecture Reference
  architectureId: uuid('architecture_id')
    .notNull()
    .references(() => educationalArchitectures.id, { onDelete: 'cascade' }),
  
  // Brand Dimension
  brandId: brandEnum('brand_id').notNull(),
  
  // Usage Metrics
  totalUsages: integer('total_usages').notNull().default(0),
  uniqueUsers: integer('unique_users').notNull().default(0),
  
  // Learning Outcomes
  averageCompletionRate: integer('average_completion_rate').notNull().default(0), // 0-100
  averageTimeToComplete: integer('average_time_to_complete').notNull().default(0), // minutes
  averageQuizScore: integer('average_quiz_score'), // 0-100
  averageAssignmentScore: integer('average_assignment_score'), // 0-100
  
  // Engagement Quality
  averageEngagementScore: integer('average_engagement_score').notNull().default(0), // 0-100
  retentionRate: integer('retention_rate').notNull().default(0), // 0-100
  
  // Feedback
  satisfactionScore: integer('satisfaction_score'), // 0-100
  recommendationRate: integer('recommendation_rate'), // 0-100
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint
  uqEducationalPerfDateArchBrand: uniqueIndex('uq_educational_perf_date_arch_brand').on(
    table.date,
    table.architectureId,
    table.brandId,
    table.aggregationLevel
  ),
  // Indexes
  idxEducationalPerfArch: index('idx_educational_perf_arch').on(table.architectureId),
  idxEducationalPerfBrand: index('idx_educational_perf_brand').on(table.brandId),
}));

/**
 * UI Architecture Performance Metrics
 * Tracks rendering performance and user experience
 */
export const uiArchitecturePerformance = pgTable('ui_architecture_performance', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  aggregationLevel: text('aggregation_level').notNull(),
  
  // Architecture Reference
  architectureId: uuid('architecture_id')
    .notNull()
    .references(() => uiArchitectures.id, { onDelete: 'cascade' }),
  
  // Brand Dimension
  brandId: brandEnum('brand_id').notNull(),
  
  // Usage Metrics
  totalRenders: integer('total_renders').notNull().default(0),
  uniqueUsers: integer('unique_users').notNull().default(0),
  
  // Performance Metrics
  averageLoadTime: integer('average_load_time').notNull().default(0), // milliseconds
  averageRenderTime: integer('average_render_time').notNull().default(0), // milliseconds
  errorRate: integer('error_rate').notNull().default(0), // 0-100
  
  // User Experience
  bounceRate: integer('bounce_rate').notNull().default(0), // 0-100
  averageSessionDuration: integer('average_session_duration').notNull().default(0), // seconds
  interactionRate: integer('interaction_rate').notNull().default(0), // 0-100
  
  // Accessibility
  accessibilityScore: integer('accessibility_score'), // 0-100
  screenReaderUsage: integer('screen_reader_usage').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint
  uqUIPerfDateArchBrand: uniqueIndex('uq_ui_perf_date_arch_brand').on(
    table.date,
    table.architectureId,
    table.brandId,
    table.aggregationLevel
  ),
  // Indexes
  idxUIPerfArch: index('idx_ui_perf_arch').on(table.architectureId),
  idxUIPerfBrand: index('idx_ui_perf_brand').on(table.brandId),
}));

/**
 * Prompt Template Performance Metrics
 * Tracks AI generation quality by template
 */
export const promptTemplatePerformance = pgTable('prompt_template_performance', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  aggregationLevel: text('aggregation_level').notNull(),
  
  // Template Reference
  templateId: uuid('template_id')
    .notNull()
    .references(() => promptTemplates.id, { onDelete: 'cascade' }),
  
  // Brand Dimension
  brandId: brandEnum('brand_id').notNull(),
  
  // Usage Metrics
  totalGenerations: integer('total_generations').notNull().default(0),
  successfulGenerations: integer('successful_generations').notNull().default(0),
  failedGenerations: integer('failed_generations').notNull().default(0),
  
  // Quality Metrics
  averageQualityScore: integer('average_quality_score').notNull().default(0), // 0-100
  averageHallucinationScore: integer('average_hallucination_score').notNull().default(0), // 0-100
  validationPassRate: integer('validation_pass_rate').notNull().default(0), // 0-100
  
  // Approval Metrics
  approvalRate: integer('approval_rate').notNull().default(0), // 0-100
  averageReviewTime: integer('average_review_time').notNull().default(0), // minutes
  regenerationRate: integer('regeneration_rate').notNull().default(0), // 0-100
  
  // Cost Metrics
  totalTokensUsed: integer('total_tokens_used').notNull().default(0),
  totalCostUsd: integer('total_cost_usd').notNull().default(0), // cents
  averageCostPerGeneration: integer('average_cost_per_generation').notNull().default(0), // cents
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint
  uqPromptPerfDateTemplateBrand: uniqueIndex('uq_prompt_perf_date_template_brand').on(
    table.date,
    table.templateId,
    table.brandId,
    table.aggregationLevel
  ),
  // Indexes
  idxPromptPerfTemplate: index('idx_prompt_perf_template').on(table.templateId),
  idxPromptPerfBrand: index('idx_prompt_perf_brand').on(table.brandId),
}));

/**
 * Type inference for TypeScript
 */
export type EducationalArchitecturePerformance = typeof educationalArchitecturePerformance.$inferSelect;
export type NewEducationalArchitecturePerformance = typeof educationalArchitecturePerformance.$inferInsert;
export type UIArchitecturePerformance = typeof uiArchitecturePerformance.$inferSelect;
export type NewUIArchitecturePerformance = typeof uiArchitecturePerformance.$inferInsert;
export type PromptTemplatePerformance = typeof promptTemplatePerformance.$inferSelect;
export type NewPromptTemplatePerformance = typeof promptTemplatePerformance.$inferInsert;
