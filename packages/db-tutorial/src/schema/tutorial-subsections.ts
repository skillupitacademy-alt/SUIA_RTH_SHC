/* istanbul ignore file */
/**
 * Tutorial Subsections - Granular Content Chunks
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 2 & GAP 4)
 * 
 * Each section contains multiple subsections for fine-grained content organization
 */

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { tutorialSections } from './tutorial-sections';
import { subsectionTypeEnum, brandEnum, brandVisibilityEnum } from './enums-modular';
import { promptTemplates } from './prompt-templates';

/**
 * Tutorial Subsections Table
 * Granular content chunks within each section
 */
export const tutorialSubsections = pgTable('tutorial_subsections', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Parent Section Reference
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  // GAP 2: Subsection Taxonomy
  subsectionType: subsectionTypeEnum('subsection_type').notNull(),
  
  // Subsection Metadata
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  
  // Content Storage (JSONB for flexibility)
  content: jsonb('content').notNull(),
  
  // Learning Metadata
  estimatedReadTime: integer('estimated_read_time'), // in minutes
  complexityLevel: integer('complexity_level').notNull().default(1), // 1-10 scale
  isRequired: boolean('is_required').notNull().default(true),
  xpReward: integer('xp_reward').notNull().default(0),
  
  // GAP 4: Brand Partitioning
  brandId: brandEnum('brand_id').notNull().default('shared'),
  brandVisibility: brandVisibilityEnum('brand_visibility').notNull().default('shared_visible'),
  brandCustomizations: jsonb('brand_customizations').$type<{
    brandId: string;
    customTitle?: string;
    customContent?: any;
    customStyling?: any;
  }[]>(),
  
  // AI Generation Metadata
  generatedByAi: boolean('generated_by_ai').notNull().default(false),
  promptTemplateId: uuid('prompt_template_id')
    .references(() => promptTemplates.id, { onDelete: 'set null' }),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  idxSubsectionsSection: index('idx_subsections_section').on(table.sectionId),
  idxSubsectionsOrder: index('idx_subsections_order').on(table.sectionId, table.orderIndex),
  idxSubsectionsType: index('idx_subsections_type').on(table.subsectionType),
  idxSubsectionsBrand: index('idx_subsections_brand').on(table.brandId),
}));

/**
 * Type inference for TypeScript
 */
export type TutorialSubsection = typeof tutorialSubsections.$inferSelect;
export type NewTutorialSubsection = typeof tutorialSubsections.$inferInsert;
