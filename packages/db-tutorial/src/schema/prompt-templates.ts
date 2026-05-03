/* istanbul ignore file */
/**
 * Prompt Templates - AI Generation Templates
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 2 & GAP 4)
 * 
 * Versioned prompt templates for each section type
 */

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sectionTypeEnum, subsectionTypeEnum, brandEnum, brandVisibilityEnum } from './enums-modular';

/**
 * Prompt Templates Table
 * Versioned templates for AI content generation
 */
export const promptTemplates = pgTable('prompt_templates', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Template Configuration
  sectionType: sectionTypeEnum('section_type').notNull(),
  subsectionType: subsectionTypeEnum('subsection_type'), // GAP 2: Subsection specialization
  name: text('name').notNull(),
  version: integer('version').notNull().default(1),
  
  // Prompt Content
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(),
  variables: jsonb('variables').$type<string[]>().notNull(),
  
  // Output Configuration
  outputSchema: jsonb('output_schema').notNull(),
  validationRules: jsonb('validation_rules').$type<{
    rule: string;
    value?: any;
    required?: boolean;
    threshold?: number;
  }[]>(),
  successCriteria: jsonb('success_criteria').$type<{
    qualityScore: { min: number };
    hallucinationScore: { max: number };
  }>(),
  
  // Model Configuration
  modelName: text('model_name').notNull().default('gpt-4'),
  temperature: integer('temperature').notNull().default(70), // 0-100 scale
  maxTokens: integer('max_tokens').notNull().default(4000),
  
  // GAP 4: Brand Partitioning
  brandId: brandEnum('brand_id').notNull().default('shared'),
  brandVisibility: brandVisibilityEnum('brand_visibility').notNull().default('shared_visible'),
  brandVariants: jsonb('brand_variants').$type<{
    brandId: string;
    customSystemPrompt?: string;
    customUserPromptTemplate?: string;
    customVariables?: string[];
    customTone?: string;
    customGuidelines?: string[];
  }[]>(),
  
  // Status & Metrics
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
  successRate: integer('success_rate').notNull().default(0), // 0-100
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one version per section type per subsection type per brand
  uqPromptSectionSubsectionVersionBrand: uniqueIndex('uq_prompt_section_subsection_version_brand').on(
    table.sectionType,
    table.subsectionType,
    table.version,
    table.brandId
  ),
  // Indexes
  idxPromptBrand: index('idx_prompt_brand').on(table.brandId),
  idxPromptSection: index('idx_prompt_section').on(table.sectionType),
  idxPromptSubsection: index('idx_prompt_subsection').on(table.subsectionType),
}));

/**
 * Type inference for TypeScript
 */
export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type NewPromptTemplate = typeof promptTemplates.$inferInsert;
