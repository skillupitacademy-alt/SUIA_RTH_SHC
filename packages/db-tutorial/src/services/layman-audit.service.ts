/**
 * Layman Audit Service
 * Phase 2B Week 2 - Hardening
 * ----------------------------
 * Comprehensive audit trail for all Layman operations
 */

import { db } from '../db';
import { laymanAuditLogs } from '../schema/layman-audit-logs';
import type { LaymanAuditLogInsert } from '../schema/layman-audit-logs';

/**
 * Audit context for operations
 */
export interface AuditContext {
  userId: string;
  userRole?: string;
  brandId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  sectionId?: string;
  promptId?: string;
  action: string;
  actionCategory: 'prompt' | 'content' | 'lifecycle' | 'governance' | 'security';
  beforeState?: any;
  afterState?: any;
  metadata?: any;
  success?: 'success' | 'failure' | 'partial';
  errorMessage?: string;
}

/**
 * Layman Audit Service
 * Records all operations for compliance and debugging
 */
export class LaymanAuditService {
  constructor(private dbInstance: typeof db = db) {}

  /**
   * Log an audit entry
   */
  async log(context: AuditContext, entry: AuditLogEntry): Promise<void> {
    try {
      // Calculate diff if both states provided
      const diff = this.calculateDiff(entry.beforeState, entry.afterState);

      const auditLog: LaymanAuditLogInsert = {
        sectionId: entry.sectionId,
        promptId: entry.promptId,
        action: entry.action as any,
        actionCategory: entry.actionCategory,
        userId: context.userId,
        userRole: context.userRole,
        brandId: context.brandId,
        beforeState: entry.beforeState,
        afterState: entry.afterState,
        diff,
        metadata: entry.metadata,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: entry.success || 'success',
        errorMessage: entry.errorMessage,
      };

      await this.dbInstance.insert(laymanAuditLogs).values(auditLog);
    } catch (error) {
      // Log audit failures to console but don't throw
      // We don't want audit failures to break business operations
      console.error('[LaymanAuditService] Failed to log audit entry:', error);
    }
  }

  /**
   * Log prompt generation
   */
  async logPromptGenerated(
    context: AuditContext,
    promptId: string,
    promptData: any
  ): Promise<void> {
    await this.log(context, {
      promptId,
      action: 'prompt_generated',
      actionCategory: 'prompt',
      afterState: promptData,
      metadata: {
        templateName: promptData.templateName,
        templateVersion: promptData.templateVersion,
      },
    });
  }

  /**
   * Log prompt export
   */
  async logPromptExported(
    context: AuditContext,
    promptId: string,
    format: string
  ): Promise<void> {
    await this.log(context, {
      promptId,
      action: 'prompt_exported',
      actionCategory: 'prompt',
      metadata: { format },
    });
  }

  /**
   * Log content ingestion
   */
  async logContentIngested(
    context: AuditContext,
    sectionId: string,
    promptId: string | undefined,
    rawContent: string
  ): Promise<void> {
    await this.log(context, {
      sectionId,
      promptId,
      action: 'content_ingested',
      actionCategory: 'content',
      metadata: {
        contentLength: rawContent.length,
        wordCount: rawContent.trim().split(/\s+/).length,
      },
    });
  }

  /**
   * Log content validation
   */
  async logContentValidated(
    context: AuditContext,
    sectionId: string,
    validationResult: any
  ): Promise<void> {
    await this.log(context, {
      sectionId,
      action: validationResult.isValid ? 'validation_passed' : 'validation_failed',
      actionCategory: 'governance',
      afterState: validationResult,
      metadata: {
        qualityScore: validationResult.qualityScore,
        hallucinationRisk: validationResult.hallucinationRisk,
        completenessScore: validationResult.completenessScore,
      },
    });
  }

  /**
   * Log section lifecycle change
   */
  async logLifecycleChange(
    context: AuditContext,
    sectionId: string,
    action: string,
    beforeState: any,
    afterState: any
  ): Promise<void> {
    await this.log(context, {
      sectionId,
      action,
      actionCategory: 'lifecycle',
      beforeState,
      afterState,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    context: AuditContext,
    action: string,
    details: any,
    success: 'success' | 'failure' = 'success'
  ): Promise<void> {
    await this.log(context, {
      action,
      actionCategory: 'security',
      metadata: details,
      success,
    });
  }

  /**
   * Log tamper detection
   */
  async logTamperDetected(
    context: AuditContext,
    promptId: string,
    details: any
  ): Promise<void> {
    await this.log(context, {
      promptId,
      action: 'tamper_detected',
      actionCategory: 'security',
      metadata: details,
      success: 'failure',
    });
  }

  /**
   * Log sanitization
   */
  async logSanitizationApplied(
    context: AuditContext,
    sectionId: string,
    sanitizationDetails: any
  ): Promise<void> {
    await this.log(context, {
      sectionId,
      action: 'sanitization_applied',
      actionCategory: 'security',
      metadata: sanitizationDetails,
    });
  }

  /**
   * Log rollback
   */
  async logRollback(
    context: AuditContext,
    sectionId: string,
    fromRevision: number,
    toRevision: number
  ): Promise<void> {
    await this.log(context, {
      sectionId,
      action: 'rollback_executed',
      actionCategory: 'lifecycle',
      metadata: {
        fromRevision,
        toRevision,
      },
    });
  }

  /**
   * Calculate diff between two states
   */
  private calculateDiff(before: any, after: any): any {
    if (!before || !after) return null;

    const diff: any = {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        diff[key] = {
          before: before[key],
          after: after[key],
        };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }

  /**
   * Get audit logs for a section
   */
  async getAuditLogsForSection(sectionId: string, limit: number = 50): Promise<any[]> {
    const logs = await this.dbInstance.query.laymanAuditLogs.findMany({
      where: (table, { eq }) => eq(table.sectionId, sectionId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit,
    });

    return logs;
  }

  /**
   * Get audit logs for a prompt
   */
  async getAuditLogsForPrompt(promptId: string, limit: number = 50): Promise<any[]> {
    const logs = await this.dbInstance.query.laymanAuditLogs.findMany({
      where: (table, { eq }) => eq(table.promptId, promptId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit,
    });

    return logs;
  }

  /**
   * Get audit logs for a user
   */
  async getAuditLogsForUser(userId: string, limit: number = 100): Promise<any[]> {
    const logs = await this.dbInstance.query.laymanAuditLogs.findMany({
      where: (table, { eq }) => eq(table.userId, userId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit,
    });

    return logs;
  }
}
