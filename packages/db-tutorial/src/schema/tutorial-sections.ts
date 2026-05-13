/* istanbul ignore file */
/**
 * Tutorial Sections - Modular Content System
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 3 & GAP 4)
 * 
 * Replaces monolithic tutorial_content with modular 12-section architecture
 */

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tutorialSubtopics } from './tutorial-subtopics';
import { tutorialDifficultyEnum } from './enums';
import { sectionTypeEnum, sectionStatusEnum, brandEnum, brandVisibilityEnum } from './enums-modular';
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
  sectionType: sectionTypeEnum('section_type').notNull(),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  
  // Content Storage (JSONB for flexibility)
  content: jsonb('content').notNull(),
  
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
  // Indexes for performance
  idxSectionsSubtopic: index('idx_sections_subtopic').on(table.subtopicId),
  idxSectionsStatus: index('idx_sections_status').on(table.status),
  idxSectionsType: index('idx_sections_type').on(table.sectionType),
  idxSectionsPublished: index('idx_sections_published').on(table.subtopicId, table.status),
  idxSectionsDelivery: index('idx_sections_delivery').on(table.subtopicId, table.difficulty, table.status, table.orderIndex),
  idxSectionsDeliveryByType: index('idx_sections_delivery_by_type').on(table.subtopicId, table.difficulty, table.sectionType, table.status),
  idxSectionsBrand: index('idx_sections_brand').on(table.brandId),
  idxSectionsArchitecture: index('idx_sections_architecture').on(table.educationalArchitectureId),
  
  // Unique constraint: one section type per subtopic per difficulty per brand
  uqSectionSubtopicTypeDifficultyBrand: uniqueIndex('uq_section_subtopic_type_difficulty_brand').on(
    table.subtopicId,
    table.sectionType,
    table.difficulty,
    table.brandId
  ),
}));

/**
 * Type inference for TypeScript
 */
export type TutorialSection = typeof tutorialSections.$inferSelect;
export type NewTutorialSection = typeof tutorialSections.$inferInsert;
