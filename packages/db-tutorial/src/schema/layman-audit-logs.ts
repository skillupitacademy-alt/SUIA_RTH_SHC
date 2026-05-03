/**
 * Layman Audit Logs Schema
 * Phase 2B Week 2 - Hardening
 * ---------------------------
 * Comprehensive audit trail for all Layman operations
 */

import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Audit action types
 */
export const laymanAuditActionEnum = pgEnum('layman_audit_action', [
  // Prompt operations
  'prompt_generated',
  'prompt_exported',
  'prompt_copied',
  'prompt_modified',
  
  // Content operations
  'content_ingested',
  'content_parsed',
  'content_validated',
  'content_revised',
  'content_sanitized',
  
  // Lifecycle operations
  'section_created',
  'section_updated',
  'section_submitted_review',
  'section_approved',
  'section_rejected',
  'section_published',
  'section_archived',
  'section_restored',
  
  // Governance operations
  'validation_passed',
  'validation_failed',
  'quality_score_calculated',
  'hallucination_detected',
  
  // Security operations
  'tamper_detected',
  'sanitization_applied',
  'rollback_executed',
]);

/**
 * Layman Audit Logs Table
 * Records all operations for compliance and debugging
 */
export const laymanAuditLogs = pgTable(
  'layman_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Entity references
    sectionId: uuid('section_id'), // Nullable for prompt-only operations
    promptId: uuid('prompt_id'), // Nullable for section-only operations
    
    // Action details
    action: laymanAuditActionEnum('action').notNull(),
    actionCategory: varchar('action_category', { length: 50 }).notNull(), // 'prompt', 'content', 'lifecycle', 'governance', 'security'
    
    // Actor information
    userId: uuid('user_id').notNull(),
    userRole: varchar('user_role', { length: 50 }), // 'admin', 'reviewer', 'system'
    
    // Brand context
    brandId: varchar('brand_id', { length: 50 }).notNull(),
    
    // Change tracking
    beforeState: jsonb('before_state'), // State before action
    afterState: jsonb('after_state'), // State after action
    diff: jsonb('diff'), // Computed diff
    
    // Metadata
    metadata: jsonb('metadata'), // Additional context
    ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
    userAgent: text('user_agent'),
    
    // Result
    success: varchar('success', { length: 20 }).notNull().default('success'), // 'success', 'failure', 'partial'
    errorMessage: text('error_message'),
    
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxSectionId: index('idx_layman_audit_section_id').on(table.sectionId),
    idxPromptId: index('idx_layman_audit_prompt_id').on(table.promptId),
    idxUserId: index('idx_layman_audit_user_id').on(table.userId),
    idxAction: index('idx_layman_audit_action').on(table.action),
    idxBrandId: index('idx_layman_audit_brand_id').on(table.brandId),
    idxCreatedAt: index('idx_layman_audit_created_at').on(table.createdAt),
  })
);

/**
 * Type inference
 */
export type LaymanAuditLog = typeof laymanAuditLogs.$inferSelect;
export type LaymanAuditLogInsert = typeof laymanAuditLogs.$inferInsert;
