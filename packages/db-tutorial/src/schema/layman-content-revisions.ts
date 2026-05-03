/**
 * Layman Content Revisions Schema
 * Phase 2B Week 2 - Hardening
 * ----------------------------
 * Tracks all content revisions for rollback and history
 */

import { index, jsonb, pgTable, text, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';

/**
 * Layman Content Revisions Table
 * Stores every version of content for rollback capability
 */
export const laymanContentRevisions = pgTable(
  'layman_content_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Section reference
    sectionId: uuid('section_id').notNull(),
    
    // Version tracking
    revisionNumber: integer('revision_number').notNull(),
    parentRevisionId: uuid('parent_revision_id'), // Previous revision
    
    // Content snapshot
    content: jsonb('content').notNull(), // Full LaymanSectionContent
    
    // Validation results at time of revision
    qualityScore: integer('quality_score'),
    hallucinationRisk: integer('hallucination_risk'),
    completenessScore: integer('completeness_score'),
    validationErrors: jsonb('validation_errors'),
    validationWarnings: jsonb('validation_warnings'),
    
    // Status at time of revision
    status: varchar('status', { length: 50 }).notNull(),
    governanceStatus: varchar('governance_status', { length: 50 }),
    
    // Change tracking
    changeType: varchar('change_type', { length: 50 }).notNull(), // 'initial', 'edit', 'ai_regeneration', 'manual_revision', 'rollback'
    changeReason: text('change_reason'),
    changedSubsections: jsonb('changed_subsections'), // Array of subsection names that changed
    
    // AI source tracking (if applicable)
    sourcePromptId: uuid('source_prompt_id'), // Link to prompt that generated this
    aiResponseRaw: text('ai_response_raw'), // Original AI response
    
    // Brand context
    brandId: varchar('brand_id', { length: 50 }).notNull(),
    
    // Metadata
    metadata: jsonb('metadata'),
    
    // Actor
    createdBy: uuid('created_by').notNull(),
    createdByRole: varchar('created_by_role', { length: 50 }),
    
    // Rollback tracking
    isCurrentVersion: varchar('is_current_version', { length: 10 }).notNull().default('yes'), // 'yes', 'no'
    replacedAt: timestamp('replaced_at', { mode: 'date' }),
    replacedBy: uuid('replaced_by'), // User who created next revision
    
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxSectionId: index('idx_layman_content_revisions_section_id').on(table.sectionId),
    idxRevisionNumber: index('idx_layman_content_revisions_revision_number').on(table.sectionId, table.revisionNumber),
    idxParentRevisionId: index('idx_layman_content_revisions_parent_id').on(table.parentRevisionId),
    idxSourcePromptId: index('idx_layman_content_revisions_prompt_id').on(table.sourcePromptId),
    idxIsCurrentVersion: index('idx_layman_content_revisions_current').on(table.sectionId, table.isCurrentVersion),
    idxCreatedAt: index('idx_layman_content_revisions_created_at').on(table.createdAt),
  })
);

/**
 * Type inference
 */
export type LaymanContentRevision = typeof laymanContentRevisions.$inferSelect;
export type LaymanContentRevisionInsert = typeof laymanContentRevisions.$inferInsert;
