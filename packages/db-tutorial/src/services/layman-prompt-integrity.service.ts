/**
 * Layman Prompt Integrity Service
 * Phase 2B Week 2 - Hardening
 * --------------------------------
 * Tamper detection and prompt verification
 */

import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { laymanPromptHistory } from '../schema/layman-prompt-history';
import type { LaymanPromptHistoryInsert } from '../schema/layman-prompt-history';
import type { GeneratedPrompt } from '../types/layman-prompt.types';

/**
 * Prompt Integrity Error
 */
export class PromptIntegrityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PromptIntegrityError';
  }
}

/**
 * Prompt verification result
 */
export interface PromptVerificationResult {
  isValid: boolean;
  promptId: string;
  expectedHash: string;
  actualHash?: string;
  tampered: boolean;
  errors: string[];
}

/**
 * Layman Prompt Integrity Service
 * Ensures prompt integrity and detects tampering
 */
export class LaymanPromptIntegrityService {
  constructor(private dbInstance: typeof db = db) {}

  /**
   * Generate hash for prompt
   */
  generatePromptHash(fullPrompt: string): string {
    return createHash('sha256').update(fullPrompt).digest('hex');
  }

  /**
   * Store prompt in history with integrity hash
   */
  async storePromptHistory(
    prompt: GeneratedPrompt,
    context: {
      subtopicId: string;
      promptTemplateId: string;
      educationalArchitectureId?: string;
      uiArchitectureId?: string;
      generatedBy: string;
    }
  ): Promise<string> {
    // Generate hash
    const promptHash = this.generatePromptHash(prompt.fullPrompt);

    const historyEntry: LaymanPromptHistoryInsert = {
      subtopicId: context.subtopicId,
      promptTemplateId: context.promptTemplateId,
      templateName: prompt.metadata.templateName || '',
      templateVersion: String(prompt.metadata.templateVersion || '1.0'),
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      fullPrompt: prompt.fullPrompt,
      variables: prompt.metadata as any,
      promptHash,
      brandId: prompt.metadata.brandId as any,
      educationalArchitectureId: context.educationalArchitectureId,
      educationalArchitectureName: prompt.metadata.educationalArchitecture,
      uiArchitectureId: context.uiArchitectureId,
      generatedBy: context.generatedBy,
    };

    const [inserted] = await this.dbInstance
      .insert(laymanPromptHistory)
      .values(historyEntry)
      .returning();

    return inserted.id;
  }

  /**
   * Verify prompt integrity
   */
  async verifyPromptIntegrity(
    promptId: string,
    providedPrompt: string
  ): Promise<PromptVerificationResult> {
    // Fetch original prompt from history
    const history = await this.dbInstance.query.laymanPromptHistory.findFirst({
      where: (table, { eq }) => eq(table.id, promptId),
    });

    if (!history) {
      return {
        isValid: false,
        promptId,
        expectedHash: '',
        tampered: false,
        errors: ['Prompt not found in history'],
      };
    }

    // Calculate hash of provided prompt
    const actualHash = this.generatePromptHash(providedPrompt);

    // Compare hashes
    const tampered = actualHash !== history.promptHash;

    return {
      isValid: !tampered,
      promptId,
      expectedHash: history.promptHash,
      actualHash,
      tampered,
      errors: tampered ? ['Prompt has been modified'] : [],
    };
  }

  /**
   * Mark prompt as used
   */
  async markPromptAsUsed(promptId: string, sectionId: string): Promise<void> {
    await this.dbInstance
      .update(laymanPromptHistory)
      .set({
        wasUsed: 'used',
        usedAt: new Date(),
        sectionId,
      })
      .where(eq(laymanPromptHistory.id, promptId));
  }

  /**
   * Track prompt export
   */
  async trackPromptExport(promptId: string, format: string): Promise<void> {
    const history = await this.dbInstance.query.laymanPromptHistory.findFirst({
      where: (table, { eq }) => eq(table.id, promptId),
    });

    if (!history) {
      throw new PromptIntegrityError('Prompt not found', 'PROMPT_NOT_FOUND', 404);
    }

    await this.dbInstance
      .update(laymanPromptHistory)
      .set({
        exportCount: (history.exportCount || 0) + 1,
        lastExportedAt: new Date(),
        exportFormat: format,
      })
      .where(eq(laymanPromptHistory.id, promptId));
  }

  /**
   * Get prompt history
   */
  async getPromptHistory(promptId: string): Promise<any> {
    const history = await this.dbInstance.query.laymanPromptHistory.findFirst({
      where: (table, { eq }) => eq(table.id, promptId),
    });

    if (!history) {
      throw new PromptIntegrityError('Prompt not found', 'PROMPT_NOT_FOUND', 404);
    }

    return history;
  }

  /**
   * Get prompts for section
   */
  async getPromptsForSection(sectionId: string): Promise<any[]> {
    const prompts = await this.dbInstance.query.laymanPromptHistory.findMany({
      where: (table, { eq }) => eq(table.sectionId, sectionId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return prompts;
  }

  /**
   * Get prompts for subtopic
   */
  async getPromptsForSubtopic(subtopicId: string): Promise<any[]> {
    const prompts = await this.dbInstance.query.laymanPromptHistory.findMany({
      where: (table, { eq }) => eq(table.subtopicId, subtopicId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return prompts;
  }

  /**
   * Get prompt statistics
   */
  async getPromptStatistics(userId: string): Promise<{
    totalGenerated: number;
    totalUsed: number;
    totalDiscarded: number;
    byTemplate: Record<string, number>;
    byBrand: Record<string, number>;
  }> {
    const prompts = await this.dbInstance.query.laymanPromptHistory.findMany({
      where: (table, { eq }) => eq(table.generatedBy, userId),
    });

    const stats = {
      totalGenerated: prompts.length,
      totalUsed: prompts.filter((p) => p.wasUsed === 'used').length,
      totalDiscarded: prompts.filter((p) => p.wasUsed === 'discarded').length,
      byTemplate: {} as Record<string, number>,
      byBrand: {} as Record<string, number>,
    };

    for (const prompt of prompts) {
      stats.byTemplate[prompt.templateName] = (stats.byTemplate[prompt.templateName] || 0) + 1;
      stats.byBrand[prompt.brandId] = (stats.byBrand[prompt.brandId] || 0) + 1;
    }

    return stats;
  }

  /**
   * Validate prompt freshness (not too old)
   */
  validatePromptFreshness(promptCreatedAt: Date, maxAgeHours: number = 24): boolean {
    const ageMs = Date.now() - promptCreatedAt.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    return ageHours <= maxAgeHours;
  }
}
