/* istanbul ignore file */
/**
 * AI Generation Orchestration - Job Coordination
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 3 & GAP 4)
 * 
 * Coordinates multi-section AI generation for a subtopic
 */

import { integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { tutorialSubtopics } from './tutorial-subtopics';
import { tutorialDifficultyEnum } from './enums';
import { orchestrationStatusEnum, brandEnum } from './enums-modular';
import { educationalArchitectures } from './educational-architectures';

/**
 * AI Generation Orchestration Table
 * Coordinates generation of multiple sections for a subtopic
 */
export const aiGenerationOrchestration = pgTable('ai_generation_orchestration', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // GAP 3: FK Hardening - Explicit References
  subtopicId: uuid('subtopic_id')
    .notNull()
    .references(() => tutorialSubtopics.id, { onDelete: 'cascade' }),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  educationalArchitectureId: uuid('educational_architecture_id')
    .notNull()
    .references(() => educationalArchitectures.id, { onDelete: 'restrict' }),
  
  // Orchestration Status
  status: orchestrationStatusEnum('status').notNull().default('pending'),
  
  // Section Tracking
  sectionsToGenerate: jsonb('sections_to_generate').$type<string[]>().notNull(),
  sectionsGenerated: jsonb('sections_generated').$type<string[]>().notNull().default([]),
  sectionsFailed: jsonb('sections_failed').$type<string[]>().notNull().default([]),
  
  // Progress Metrics
  totalSections: integer('total_sections').notNull(),
  completedSections: integer('completed_sections').notNull().default(0),
  failedSections: integer('failed_sections').notNull().default(0),
  
  // Timing
  startedAt: timestamp('started_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  estimatedCompletionAt: timestamp('estimated_completion_at', { mode: 'date' }),
  
  // Cost Tracking
  totalTokensUsed: integer('total_tokens_used').notNull().default(0),
  totalCostUsd: integer('total_cost_usd').notNull().default(0), // stored as cents
  
  // Error Handling
  error: text('error'),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  
  // GAP 4: Brand Partitioning
  brandId: brandEnum('brand_id').notNull().default('shared'),
  
  // Audit
  initiatedBy: uuid('initiated_by').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  idxOrchestrationStatus: index('idx_orchestration_status').on(table.status),
  idxOrchestrationSubtopic: index('idx_orchestration_subtopic').on(table.subtopicId),
  idxOrchestrationInitiator: index('idx_orchestration_initiator').on(table.initiatedBy),
  idxOrchestrationBrand: index('idx_orchestration_brand').on(table.brandId),
  idxOrchestrationArchitecture: index('idx_orchestration_architecture').on(table.educationalArchitectureId),
}));

/**
 * Type inference for TypeScript
 */
export type AIGenerationOrchestration = typeof aiGenerationOrchestration.$inferSelect;
export type NewAIGenerationOrchestration = typeof aiGenerationOrchestration.$inferInsert;
