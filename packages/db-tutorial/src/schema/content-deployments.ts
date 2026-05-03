/* istanbul ignore file */
/**
 * Content Deployments - Deployment Governance
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 3 & GAP 4)
 * 
 * Manages staged rollout, A/B testing, and deployment tracking
 */

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { tutorialSections } from './tutorial-sections';
import { deploymentTypeEnum, brandEnum } from './enums-modular';

/**
 * Content Deployments Table
 * Tracks deployment lifecycle and rollout strategy
 */
export const contentDeployments = pgTable('content_deployments', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // GAP 3: FK Hardening - Explicit Content Reference
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'restrict' }),
  version: integer('version').notNull(),
  
  // Deployment Strategy
  deploymentType: deploymentTypeEnum('deployment_type').notNull().default('full'),
  targetAudience: jsonb('target_audience').$type<string[]>(),
  rolloutPercentage: integer('rollout_percentage').notNull().default(100), // 0-100
  
  // A/B Testing
  experimentId: uuid('experiment_id'),
  variantName: text('variant_name'),
  
  // Rollback Configuration
  rollbackVersion: integer('rollback_version'),
  canRollback: boolean('can_rollback').notNull().default(true),
  
  // Deployment Status
  status: text('status').notNull().default('pending'), // pending, deploying, deployed, failed, rolled_back
  
  // GAP 4: Brand Partitioning
  brandId: brandEnum('brand_id').notNull(),
  brandTargets: jsonb('brand_targets').$type<{
    brandId: string;
    deploymentUrl: string;
    deployedAt?: string;
    status: string;
  }[]>(),
  
  // Performance Metrics
  impressions: integer('impressions').notNull().default(0),
  completionRate: integer('completion_rate').notNull().default(0), // 0-100
  feedbackScore: integer('feedback_score'), // 0-100
  errorRate: integer('error_rate'), // 0-100
  
  // Timing
  deployedAt: timestamp('deployed_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  rolledBackAt: timestamp('rolled_back_at', { mode: 'date' }),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  idxDeploymentsSection: index('idx_deployments_section').on(table.sectionId),
  idxDeploymentsStatus: index('idx_deployments_status').on(table.status),
  idxDeploymentsExperiment: index('idx_deployments_experiment').on(table.experimentId),
  idxDeploymentsBrand: index('idx_deployments_brand').on(table.brandId),
}));

/**
 * Type inference for TypeScript
 */
export type ContentDeployment = typeof contentDeployments.$inferSelect;
export type NewContentDeployment = typeof contentDeployments.$inferInsert;
