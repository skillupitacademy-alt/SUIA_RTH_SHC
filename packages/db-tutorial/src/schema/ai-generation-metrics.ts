/* istanbul ignore file */
/**
 * AI Generation Metrics - Analytics & Monitoring
 * Phase 1 P0 Foundation - Database Governance
 * 
 * Aggregated metrics for AI generation performance and cost tracking
 */

import { integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * AI Generation Metrics Table
 * Time-series metrics for AI generation monitoring
 */
export const aiGenerationMetrics = pgTable('ai_generation_metrics', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  hour: integer('hour'), // 0-23, null for daily aggregation
  aggregationLevel: text('aggregation_level').notNull(), // hourly, daily, weekly
  
  // Generation Metrics
  totalGenerations: integer('total_generations').notNull().default(0),
  successfulGenerations: integer('successful_generations').notNull().default(0),
  failedGenerations: integer('failed_generations').notNull().default(0),
  
  // Quality Metrics
  validationPassRate: integer('validation_pass_rate').notNull().default(0), // 0-100
  averageQualityScore: integer('average_quality_score').notNull().default(0), // 0-100
  averageHallucinationScore: integer('average_hallucination_score').notNull().default(0), // 0-100
  hallucinationIncidents: integer('hallucination_incidents').notNull().default(0),
  
  // Approval Metrics
  approvalRate: integer('approval_rate').notNull().default(0), // 0-100
  averageReviewTimeMinutes: integer('average_review_time_minutes').notNull().default(0),
  
  // Performance Metrics
  averageGenerationTimeMs: integer('average_generation_time_ms').notNull().default(0),
  
  // Cost Metrics
  totalTokensUsed: integer('total_tokens_used').notNull().default(0),
  totalCostUsd: integer('total_cost_usd').notNull().default(0), // stored as cents
  
  // Provider Breakdown
  providerBreakdown: jsonb('provider_breakdown').$type<{
    provider: string;
    model: string;
    generations: number;
    tokensUsed: number;
    costUsd: number;
  }[]>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one record per time period
  uqMetricsDateHourLevel: uniqueIndex('uq_metrics_date_hour_level').on(
    table.date,
    table.hour,
    table.aggregationLevel
  ),
}));

/**
 * Type inference for TypeScript
 */
export type AIGenerationMetrics = typeof aiGenerationMetrics.$inferSelect;
export type NewAIGenerationMetrics = typeof aiGenerationMetrics.$inferInsert;
