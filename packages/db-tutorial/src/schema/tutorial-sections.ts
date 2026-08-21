/* istanbul ignore file */
/**
 * Tutorial Sections - Modular Content System
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 3 & GAP 4)
 * UPDATED: Phase B.2 - Legacy Eradication (removed section_type, difficulty)
 *
 * V2 Architecture: One tutorial per subtopic per brand (multi-brand support)
 */

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import type { TutorialDocument } from '@quiz/types';
import { tutorialSubtopics } from './tutorial-subtopics';
// REMOVED: tutorialDifficultyEnum (legacy)
// REMOVED: sectionTypeEnum (legacy)
import { sectionStatusEnum, brandEnum, brandVisibilityEnum } from './enums-modular';
import { educationalArchitectures } from './educational-architectures';
import { uiArchitectures } from './ui-architectures';
import { promptTemplates } from './prompt-templates';

/**
 * Tutorial Sections Table
 * Core modular content table - one row per section type per subtopic per difficulty
 */
export const tutorialSections = pgTable('tutorial_sections', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // Hierarchy Reference
  subtopicId: uuid('subtopic_id')
    .notNull()
    .references(() => tutorialSubtopics.id, { onDelete: 'cascade' }),

  // Section Configuration
  // REMOVED: sectionType (legacy - dropped in Phase B)
  // REMOVED: difficulty (legacy - dropped in Phase B)
  orderIndex: integer('order_index').notNull().default(0),

  // Content Storage (JSONB for flexibility)
  content: jsonb('content').$type<TutorialDocument>().notNull(),

  // Versioning
  version: integer('version').notNull().default(1),
  language: text('language').notNull().default('en'),

  // Lifecycle Status
  status: sectionStatusEnum('status').notNull().default('draft'),

  // AI Generation Metadata
  generatedByAi: boolean('generated_by_ai').notNull().default(false),
  aiModelUsed: text('ai_model_used'),
  generationJobId: uuid('generation_job_id'),
  qualityScore: integer('quality_score'),
  hallucinationScore: integer('hallucination_score'),
  regenerationCount: integer('regeneration_count').notNull().default(0),

  // Approval Workflow
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  rejectionReason: text('rejection_reason'),

  // GAP 3: FK Hardening - Explicit Architecture References
  promptTemplateId: uuid('prompt_template_id')
    .references(() => promptTemplates.id, { onDelete: 'set null' }),
  educationalArchitectureId: uuid('educational_architecture_id')
    .references(() => educationalArchitectures.id, { onDelete: 'set null' }),
  uiArchitectureId: uuid('ui_architecture_id')
    .references(() => uiArchitectures.id, { onDelete: 'set null' }),

  // GAP 4: Brand Partitioning
  brandId: brandEnum('brand_id').notNull().default('shared'),
  brandVisibility: brandVisibilityEnum('brand_visibility').notNull().default('shared_visible'),
  brandCustomizations: jsonb('brand_customizations').$type<{
    brandId: string;
    customTitle?: string;
    customStyling?: any;
    customMetadata?: any;
  }[]>(),

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  // V2 Optimized Indexes (Phase B.2 - Post-Eradication)
  idxTutorialV2Delivery: index('idx_tutorial_v2_delivery').on(table.subtopicId, table.brandId, table.status),
  idxTutorialV2ByBrand: index('idx_tutorial_v2_by_brand').on(table.brandId, table.status, table.updatedAt),
  idxTutorialV2ByStatus: index('idx_tutorial_v2_by_status').on(table.status, table.updatedAt),
  idxTutorialV2ByArchitecture: index('idx_tutorial_v2_by_architecture').on(table.educationalArchitectureId),
  idxTutorialV2SubtopicStatus: index('idx_tutorial_v2_subtopic_status').on(table.subtopicId, table.status),

  // V2 Identity Constraint: one tutorial per subtopic per brand
  uqTutorialV2Identity: uniqueIndex('uq_tutorial_v2_identity').on(
    table.subtopicId,
    table.brandId
  ),
}));

/**
 * Type inference for TypeScript
 */
export type TutorialSection = typeof tutorialSections.$inferSelect;
export type NewTutorialSection = typeof tutorialSections.$inferInsert;
