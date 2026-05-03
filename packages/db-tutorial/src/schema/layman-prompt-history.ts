/**
 * Layman Prompt History Schema
 * Phase 2B Week 2 - Hardening
 * ----------------------------
 * Tracks all generated prompts for versioning and rollback
 */

import { index, jsonb, pgTable, text, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';

/**
 * Layman Prompt History Table
 * Stores every generated prompt with integrity verification
 */
export const laymanPromptHistory = pgTable(
  'layman_prompt_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Section reference
    sectionId: uuid('section_id'), // Nullable if prompt not yet used
    subtopicId: uuid('subtopic_id').notNull(),
    
    // Prompt details
    promptTemplateId: uuid('prompt_template_id').notNull(),
    templateName: varchar('template_name', { length: 255 }).notNull(),
    templateVersion: varchar('template_version', { length: 50 }).notNull(),
    
    // Generated content
    systemPrompt: text('system_prompt').notNull(),
    userPrompt: text('user_prompt').notNull(),
    fullPrompt: text('full_prompt').notNull(),
    
    // Variables used
    variables: jsonb('variables').notNull(), // PromptTemplateVariables
    
    // Integrity verification
    promptHash: varchar('prompt_hash', { length: 64 }).notNull(), // SHA-256 hash
    promptSignature: text('prompt_signature'), // Optional cryptographic signature
    
    // Brand context
    brandId: varchar('brand_id', { length: 50 }).notNull(),
    
    // Educational context
    educationalArchitectureId: uuid('educational_architecture_id'),
    educationalArchitectureName: varchar('educational_architecture_name', { length: 255 }),
    uiArchitectureId: uuid('ui_architecture_id'),
    uiArchitectureName: varchar('ui_architecture_name', { length: 255 }),
    
    // Usage tracking
    wasUsed: varchar('was_used', { length: 20 }).notNull().default('pending'), // 'pending', 'used', 'discarded'
    usedAt: timestamp('used_at', { mode: 'date' }),
    
    // Export tracking
    exportCount: integer('export_count').notNull().default(0),
    lastExportedAt: timestamp('last_exported_at', { mode: 'date' }),
    exportFormat: varchar('export_format', { length: 50 }), // 'plain', 'markdown', 'json'
    
    // Metadata
    metadata: jsonb('metadata'), // Additional context
    
    // Actor
    generatedBy: uuid('generated_by').notNull(),
    
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxSectionId: index('idx_layman_prompt_history_section_id').on(table.sectionId),
    idxSubtopicId: index('idx_layman_prompt_history_subtopic_id').on(table.subtopicId),
    idxPromptHash: index('idx_layman_prompt_history_hash').on(table.promptHash),
    idxBrandId: index('idx_layman_prompt_history_brand_id').on(table.brandId),
    idxCreatedAt: index('idx_layman_prompt_history_created_at').on(table.createdAt),
  })
);

/**
 * Type inference
 */
export type LaymanPromptHistory = typeof laymanPromptHistory.$inferSelect;
export type LaymanPromptHistoryInsert = typeof laymanPromptHistory.$inferInsert;
