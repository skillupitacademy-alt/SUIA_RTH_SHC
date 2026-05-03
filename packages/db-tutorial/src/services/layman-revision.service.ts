/**
 * Layman Revision Service
 * Phase 2B Week 2 - Hardening
 * ----------------------------
 * Manages content revisions and rollback
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { laymanContentRevisions } from '../schema/layman-content-revisions';
import type { LaymanContentRevisionInsert } from '../schema/layman-content-revisions';
import type { LaymanSectionContent } from '../types/layman.types';

/**
 * Revision Error
 */
export class RevisionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'RevisionError';
  }
}

/**
 * Revision metadata
 */
export interface RevisionMetadata {
  changeType: 'initial' | 'edit' | 'ai_regeneration' | 'manual_revision' | 'rollback';
  changeReason?: string;
  changedSubsections?: string[];
  sourcePromptId?: string;
  aiResponseRaw?: string;
}

/**
 * Revision comparison
 */
export interface RevisionComparison {
  fromRevision: number;
  toRevision: number;
  changedSubsections: string[];
  additions: Record<string, any>;
  deletions: Record<string, any>;
  modifications: Record<string, { before: any; after: any }>;
}

/**
 * Layman Revision Service
 * Tracks all content versions for rollback capability
 */
export class LaymanRevisionService {
  constructor(private dbInstance: typeof db = db) {}

  /**
   * Create initial revision
   */
  async createInitialRevision(
    sectionId: string,
    content: LaymanSectionContent,
    context: {
      brandId: string;
      createdBy: string;
      createdByRole?: string;
      status: string;
      validationResults?: any;
      sourcePromptId?: string;
      aiResponseRaw?: string;
    }
  ): Promise<string> {
    const revision: LaymanContentRevisionInsert = {
      sectionId,
      revisionNumber: 1,
      content: content as any,
      qualityScore: context.validationResults?.qualityScore,
      hallucinationRisk: context.validationResults?.hallucinationRisk,
      completenessScore: context.validationResults?.completenessScore,
      validationErrors: context.validationResults?.errors,
      validationWarnings: context.validationResults?.warnings,
      status: context.status,
      governanceStatus: context.validationResults?.governanceStatus,
      changeType: 'initial',
      changeReason: 'Initial content creation',
      brandId: context.brandId as any,
      createdBy: context.createdBy,
      createdByRole: context.createdByRole,
      sourcePromptId: context.sourcePromptId,
      aiResponseRaw: context.aiResponseRaw,
      isCurrentVersion: 'yes',
    };

    const [inserted] = await this.dbInstance
      .insert(laymanContentRevisions)
      .values(revision)
      .returning();

    return inserted.id;
  }

  /**
   * Create new revision
   */
  async createRevision(
    sectionId: string,
    content: LaymanSectionContent,
    metadata: RevisionMetadata,
    context: {
      brandId: string;
      createdBy: string;
      createdByRole?: string;
      status: string;
      validationResults?: any;
    }
  ): Promise<string> {
    // Get current revision
    const currentRevision = await this.getCurrentRevision(sectionId);
    
    if (!currentRevision) {
      throw new RevisionError('No current revision found', 'NO_CURRENT_REVISION', 404);
    }

    const newRevisionNumber = currentRevision.revisionNumber + 1;

    // Mark current revision as no longer current
    await this.dbInstance
      .update(laymanContentRevisions)
      .set({
        isCurrentVersion: 'no',
        replacedAt: new Date(),
        replacedBy: context.createdBy,
      })
      .where(eq(laymanContentRevisions.id, currentRevision.id));

    // Create new revision
    const revision: LaymanContentRevisionInsert = {
      sectionId,
      revisionNumber: newRevisionNumber,
      parentRevisionId: currentRevision.id,
      content: content as any,
      qualityScore: context.validationResults?.qualityScore,
      hallucinationRisk: context.validationResults?.hallucinationRisk,
      completenessScore: context.validationResults?.completenessScore,
      validationErrors: context.validationResults?.errors,
      validationWarnings: context.validationResults?.warnings,
      status: context.status,
      governanceStatus: context.validationResults?.governanceStatus,
      changeType: metadata.changeType,
      changeReason: metadata.changeReason,
      changedSubsections: metadata.changedSubsections as any,
      sourcePromptId: metadata.sourcePromptId,
      aiResponseRaw: metadata.aiResponseRaw,
      brandId: context.brandId as any,
      createdBy: context.createdBy,
      createdByRole: context.createdByRole,
      isCurrentVersion: 'yes',
    };

    const [inserted] = await this.dbInstance
      .insert(laymanContentRevisions)
      .values(revision)
      .returning();

    return inserted.id;
  }

  /**
   * Get current revision
   */
  async getCurrentRevision(sectionId: string): Promise<any | null> {
    const revision = await this.dbInstance.query.laymanContentRevisions.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.sectionId, sectionId), eq(table.isCurrentVersion, 'yes')),
    });

    return revision || null;
  }

  /**
   * Get revision by number
   */
  async getRevisionByNumber(sectionId: string, revisionNumber: number): Promise<any | null> {
    const revision = await this.dbInstance.query.laymanContentRevisions.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.sectionId, sectionId), eq(table.revisionNumber, revisionNumber)),
    });

    return revision || null;
  }

  /**
   * Get all revisions for section
   */
  async getRevisionHistory(sectionId: string, limit: number = 50): Promise<any[]> {
    const revisions = await this.dbInstance.query.laymanContentRevisions.findMany({
      where: (table, { eq }) => eq(table.sectionId, sectionId),
      orderBy: (table, { desc }) => [desc(table.revisionNumber)],
      limit,
    });

    return revisions;
  }

  /**
   * Rollback to specific revision
   */
  async rollbackToRevision(
    sectionId: string,
    targetRevisionNumber: number,
    context: {
      brandId: string;
      createdBy: string;
      createdByRole?: string;
      reason: string;
    }
  ): Promise<string> {
    // Get target revision
    const targetRevision = await this.getRevisionByNumber(sectionId, targetRevisionNumber);
    
    if (!targetRevision) {
      throw new RevisionError(
        `Revision ${targetRevisionNumber} not found`,
        'REVISION_NOT_FOUND',
        404
      );
    }

    // Get current revision
    const currentRevision = await this.getCurrentRevision(sectionId);
    
    if (!currentRevision) {
      throw new RevisionError('No current revision found', 'NO_CURRENT_REVISION', 404);
    }

    // Create new revision with rolled-back content
    const newRevisionId = await this.createRevision(
      sectionId,
      targetRevision.content,
      {
        changeType: 'rollback',
        changeReason: `Rolled back to revision ${targetRevisionNumber}: ${context.reason}`,
      },
      {
        brandId: context.brandId,
        createdBy: context.createdBy,
        createdByRole: context.createdByRole,
        status: targetRevision.status,
        validationResults: {
          qualityScore: targetRevision.qualityScore,
          hallucinationRisk: targetRevision.hallucinationRisk,
          completenessScore: targetRevision.completenessScore,
          errors: targetRevision.validationErrors,
          warnings: targetRevision.validationWarnings,
          governanceStatus: targetRevision.governanceStatus,
        },
      }
    );

    return newRevisionId;
  }

  /**
   * Compare two revisions
   */
  async compareRevisions(
    sectionId: string,
    fromRevisionNumber: number,
    toRevisionNumber: number
  ): Promise<RevisionComparison> {
    const fromRevision = await this.getRevisionByNumber(sectionId, fromRevisionNumber);
    const toRevision = await this.getRevisionByNumber(sectionId, toRevisionNumber);

    if (!fromRevision || !toRevision) {
      throw new RevisionError('One or both revisions not found', 'REVISION_NOT_FOUND', 404);
    }

    const fromContent = fromRevision.content?.subsections || {};
    const toContent = toRevision.content?.subsections || {};

    const changedSubsections: string[] = [];
    const additions: Record<string, any> = {};
    const deletions: Record<string, any> = {};
    const modifications: Record<string, { before: any; after: any }> = {};

    // Find all subsection keys
    const allKeys = new Set([...Object.keys(fromContent), ...Object.keys(toContent)]);

    for (const key of allKeys) {
      const fromValue = fromContent[key];
      const toValue = toContent[key];

      if (!fromValue && toValue) {
        // Addition
        additions[key] = toValue;
        changedSubsections.push(key);
      } else if (fromValue && !toValue) {
        // Deletion
        deletions[key] = fromValue;
        changedSubsections.push(key);
      } else if (JSON.stringify(fromValue) !== JSON.stringify(toValue)) {
        // Modification
        modifications[key] = { before: fromValue, after: toValue };
        changedSubsections.push(key);
      }
    }

    return {
      fromRevision: fromRevisionNumber,
      toRevision: toRevisionNumber,
      changedSubsections,
      additions,
      deletions,
      modifications,
    };
  }

  /**
   * Get revision statistics
   */
  async getRevisionStatistics(sectionId: string): Promise<{
    totalRevisions: number;
    currentRevision: number;
    changeTypes: Record<string, number>;
    averageQualityScore: number;
    qualityTrend: 'improving' | 'declining' | 'stable';
  }> {
    const revisions = await this.getRevisionHistory(sectionId, 100);

    const stats = {
      totalRevisions: revisions.length,
      currentRevision: revisions[0]?.revisionNumber || 0,
      changeTypes: {} as Record<string, number>,
      averageQualityScore: 0,
      qualityTrend: 'stable' as 'improving' | 'declining' | 'stable',
    };

    // Count change types
    for (const revision of revisions) {
      const changeType = revision.changeType || 'unknown';
      stats.changeTypes[changeType] = (stats.changeTypes[changeType] || 0) + 1;
    }

    // Calculate average quality score
    const scoresWithValues = revisions.filter((r) => r.qualityScore != null);
    if (scoresWithValues.length > 0) {
      const sum = scoresWithValues.reduce((acc, r) => acc + (r.qualityScore || 0), 0);
      stats.averageQualityScore = Math.round(sum / scoresWithValues.length);
    }

    // Determine quality trend (compare first 3 and last 3)
    if (scoresWithValues.length >= 6) {
      const recent = scoresWithValues.slice(0, 3);
      const older = scoresWithValues.slice(-3);
      
      const recentAvg = recent.reduce((acc, r) => acc + (r.qualityScore || 0), 0) / 3;
      const olderAvg = older.reduce((acc, r) => acc + (r.qualityScore || 0), 0) / 3;
      
      if (recentAvg > olderAvg + 5) {
        stats.qualityTrend = 'improving';
      } else if (recentAvg < olderAvg - 5) {
        stats.qualityTrend = 'declining';
      }
    }

    return stats;
  }

  /**
   * Detect changed subsections between content versions
   */
  detectChangedSubsections(
    oldContent: LaymanSectionContent,
    newContent: LaymanSectionContent
  ): string[] {
    const changed: string[] = [];
    const oldSubsections = oldContent.subsections || {};
    const newSubsections = newContent.subsections || {};

    const allKeys = new Set([...Object.keys(oldSubsections), ...Object.keys(newSubsections)]);

    for (const key of allKeys) {
      const oldValue = (oldSubsections as any)[key];
      const newValue = (newSubsections as any)[key];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changed.push(key);
      }
    }

    return changed;
  }
}
