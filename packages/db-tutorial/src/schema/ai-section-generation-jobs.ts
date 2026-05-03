/* istanbul ignore file */
/**
 * AI Section Generation Jobs - Individual Section Generation
 * Phase 1 P0 Foundation - Database Governance
 * 
 * Tracks individual section generation jobs within an orchestration
 */

import { integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { aiGenerationOrchestration } from './ai-generation-orchestration';
import { tutorialDifficultyEnum } from './enums';
import { sectionTypeEnum, jobStatusEnum } from './enums-modular';

/**
 * AI Section Generation Jobs Table
 * Individual section generation jobs
 */
export const aiSectionGenerationJobs = pgTable('ai_section_generation_jobs', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Parent Orchestration
  orchestrationId: uuid('orchestration_id')
    .notNull()
    .references(() => aiGenerationOrchestration.id, { onDelete: 'cascade' }),
  
  // Target Configuration
  sectionType: sectionTypeEnum('section_type').notNull(),
  subtopicId: uuid('subtopic_id').notNull(),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  
  // Prompt Configuration
  promptTemplateId: uuid('prompt_template_id').notNull(),
  promptVersion: integer('prompt_version').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  userPrompt: text('user_prompt').notNull(),
  promptVariables: jsonb('prompt_variables').notNull(),
  
  // AI Model Configuration
  aiProvider: text('ai_provider').notNull(), // openai, anthropic, etc.
  modelName: text('model_name').notNull(), // gpt-4, claude-3-opus, etc.
  temperature: integer('temperature').notNull().default(70), // 0-100 scale
  maxTokens: integer('max_tokens').notNull().default(4000),
  
  // Job Status
  status: jobStatusEnum('status').notNull().default('pending'),
  
  // Generation Output
  rawOutput: text('raw_output'),
  parsedOutput: jsonb('parsed_output'),
  
  // Validation Results
  validationStatus: text('validation_status'), // passed, failed, warning
  validationErrors: jsonb('validation_errors').$type<any[]>(),
  validationWarnings: jsonb('validation_warnings').$type<any[]>(),
  
  // Quality Metrics
  qualityScore: integer('quality_score'), // 0-100
  hallucinationScore: integer('hallucination_score'), // 0-100, lower is better
  hallucinationFlags: jsonb('hallucination_flags').$type<any[]>(),
  
  // Cost Tracking
  tokensUsed: integer('tokens_used'),
  costUsd: integer('cost_usd'), // stored as cents
  generationTimeMs: integer('generation_time_ms'),
  
  // Error Handling
  error: text('error'),
  retryCount: integer('retry_count').notNull().default(0),
  
  // Timing
  startedAt: timestamp('started_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  idxJobsOrchestration: index('idx_jobs_orchestration').on(table.orchestrationId),
  idxJobsStatus: index('idx_jobs_status').on(table.status),
  idxJobsSection: index('idx_jobs_section').on(table.sectionType),
}));

/**
 * Type inference for TypeScript
 */
export type AISectionGenerationJob = typeof aiSectionGenerationJobs.$inferSelect;
export type NewAISectionGenerationJob = typeof aiSectionGenerationJobs.$inferInsert;
