/* istanbul ignore file */
/**
 * Brand & Business Analytics - GAP 5 REMEDIATION
 * Phase 1 P0 Foundation - Database Governance
 * 
 * Brand performance, revenue, retention, and business metrics
 */

import { integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { brandEnum } from './enums-modular';

/**
 * Brand Performance Metrics
 * Tracks overall brand health and performance
 */
export const brandPerformanceMetrics = pgTable('brand_performance_metrics', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  aggregationLevel: text('aggregation_level').notNull(), // daily, weekly, monthly, quarterly
  
  // Brand Dimension
  brandId: brandEnum('brand_id').notNull(),
  
  // User Metrics
  totalUsers: integer('total_users').notNull().default(0),
  activeUsers: integer('active_users').notNull().default(0),
  newUsers: integer('new_users').notNull().default(0),
  churnedUsers: integer('churned_users').notNull().default(0),
  
  // Engagement Metrics
  averageSessionsPerUser: integer('average_sessions_per_user').notNull().default(0),
  averageSessionDuration: integer('average_session_duration').notNull().default(0), // seconds
  totalContentViews: integer('total_content_views').notNull().default(0),
  
  // Learning Metrics
  tutorialsStarted: integer('tutorials_started').notNull().default(0),
  tutorialsCompleted: integer('tutorials_completed').notNull().default(0),
  averageCompletionRate: integer('average_completion_rate').notNull().default(0), // 0-100
  certificatesIssued: integer('certificates_issued').notNull().default(0),
  
  // Retention Metrics
  dayOneRetention: integer('day_one_retention').notNull().default(0), // 0-100
  daySevenRetention: integer('day_seven_retention').notNull().default(0), // 0-100
  dayThirtyRetention: integer('day_thirty_retention').notNull().default(0), // 0-100
  
  // Conversion Metrics
  freeToProConversions: integer('free_to_pro_conversions').notNull().default(0),
  conversionRate: integer('conversion_rate').notNull().default(0), // 0-100
  
  // Revenue Metrics (in cents)
  totalRevenue: integer('total_revenue').notNull().default(0),
  subscriptionRevenue: integer('subscription_revenue').notNull().default(0),
  averageRevenuePerUser: integer('average_revenue_per_user').notNull().default(0),
  
  // Satisfaction Metrics
  npsScore: integer('nps_score'), // -100 to 100
  averageSatisfactionScore: integer('average_satisfaction_score'), // 0-100
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint
  uqBrandPerfDateBrand: uniqueIndex('uq_brand_perf_date_brand').on(
    table.date,
    table.brandId,
    table.aggregationLevel
  ),
  // Indexes
  idxBrandPerfBrand: index('idx_brand_perf_brand').on(table.brandId),
  idxBrandPerfDate: index('idx_brand_perf_date').on(table.date),
}));

/**
 * Deployment Cohort Metrics
 * Tracks performance of content deployment cohorts
 */
export const deploymentCohortMetrics = pgTable('deployment_cohort_metrics', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  aggregationLevel: text('aggregation_level').notNull(),
  
  // Cohort Identification
  deploymentId: uuid('deployment_id').notNull(),
  cohortName: text('cohort_name').notNull(),
  
  // Brand Dimension
  brandId: brandEnum('brand_id').notNull(),
  
  // Cohort Size
  totalUsers: integer('total_users').notNull().default(0),
  activeUsers: integer('active_users').notNull().default(0),
  
  // Performance Metrics
  averageCompletionRate: integer('average_completion_rate').notNull().default(0), // 0-100
  averageEngagementScore: integer('average_engagement_score').notNull().default(0), // 0-100
  averageTimeSpent: integer('average_time_spent').notNull().default(0), // seconds
  
  // Comparison Metrics
  controlGroupCompletionRate: integer('control_group_completion_rate'), // 0-100
  liftVsControl: integer('lift_vs_control'), // -100 to 100
  
  // Business Impact
  conversionRate: integer('conversion_rate').notNull().default(0), // 0-100
  revenueImpact: integer('revenue_impact').notNull().default(0), // cents
  
  // Statistical Significance
  sampleSize: integer('sample_size').notNull().default(0),
  confidenceLevel: integer('confidence_level'), // 0-100
  isStatisticallySignificant: text('is_statistically_significant'), // yes, no, pending
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint
  uqDeploymentCohortDateBrand: uniqueIndex('uq_deployment_cohort_date_brand').on(
    table.date,
    table.deploymentId,
    table.cohortName,
    table.brandId,
    table.aggregationLevel
  ),
  // Indexes
  idxDeploymentCohort: index('idx_deployment_cohort').on(table.deploymentId),
  idxDeploymentBrand: index('idx_deployment_brand').on(table.brandId),
}));

/**
 * Revenue Attribution Metrics
 * Tracks revenue attribution to content and features
 */
export const revenueAttributionMetrics = pgTable('revenue_attribution_metrics', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Time Dimension
  date: timestamp('date', { mode: 'date' }).notNull(),
  aggregationLevel: text('aggregation_level').notNull(),
  
  // Brand Dimension
  brandId: brandEnum('brand_id').notNull(),
  
  // Attribution Dimensions
  attributionSource: text('attribution_source').notNull(), // tutorial, quiz, project, assignment, etc.
  attributionId: uuid('attribution_id'), // ID of the specific content
  
  // Revenue Metrics (in cents)
  directRevenue: integer('direct_revenue').notNull().default(0),
  assistedRevenue: integer('assisted_revenue').notNull().default(0),
  totalAttributedRevenue: integer('total_attributed_revenue').notNull().default(0),
  
  // Conversion Metrics
  conversions: integer('conversions').notNull().default(0),
  conversionRate: integer('conversion_rate').notNull().default(0), // 0-100
  
  // User Journey
  averageTouchpoints: integer('average_touchpoints').notNull().default(0),
  averageTimeToConversion: integer('average_time_to_conversion').notNull().default(0), // hours
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint
  uqRevenueAttrDateSourceBrand: uniqueIndex('uq_revenue_attr_date_source_brand').on(
    table.date,
    table.attributionSource,
    table.attributionId,
    table.brandId,
    table.aggregationLevel
  ),
  // Indexes
  idxRevenueAttrBrand: index('idx_revenue_attr_brand').on(table.brandId),
  idxRevenueAttrSource: index('idx_revenue_attr_source').on(table.attributionSource),
}));

/**
 * Type inference for TypeScript
 */
export type BrandPerformanceMetrics = typeof brandPerformanceMetrics.$inferSelect;
export type NewBrandPerformanceMetrics = typeof brandPerformanceMetrics.$inferInsert;
export type DeploymentCohortMetrics = typeof deploymentCohortMetrics.$inferSelect;
export type NewDeploymentCohortMetrics = typeof deploymentCohortMetrics.$inferInsert;
export type RevenueAttributionMetrics = typeof revenueAttributionMetrics.$inferSelect;
export type NewRevenueAttributionMetrics = typeof revenueAttributionMetrics.$inferInsert;
