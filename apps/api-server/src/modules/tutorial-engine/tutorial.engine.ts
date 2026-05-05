/**
 * Tutorial Engine - Centralized Tutorial Orchestration
 * 
 * Follows the same pattern as ExamEngine for consistency.
 * Handles all tutorial-related business logic with brand awareness.
 * 
 * @module tutorial-engine
 */

import { TutorialContentRepository, TutorialProgressRepository } from '@quiz/db-tutorial';
import type { TutorialDifficulty } from '@quiz/types';
import { logger } from '@/lib/logger';
import { container } from '@/modules/core/container';

export type TutorialBrand = 'realtutorialhub' | 'skillup' | 'shared';
export type BlockType = 'notes' | 'layman' | 'real_life' | 'technical' | 'code' | 'ai_tutor';

const TOKENS = {
  TutorialContentRepository: 'ITutorialContentRepository',
  TutorialProgressRepository: 'ITutorialProgressRepository',
} as const;

export interface TutorialContentOptions {
  subtopicId: string;
  userId: string;
  brandId: TutorialBrand;
  difficulty?: TutorialDifficulty;
  includeProgress?: boolean;
}

export interface TutorialProgressOptions {
  userId: string;
  subtopicId: string;
  blockType: BlockType;
  brandId: TutorialBrand;
}

export interface TutorialContent {
  id: string;
  subtopicId: string;
  brandId: TutorialBrand;
  difficulty: string;
  content: any;
  brandCustomizations?: any;
  progress?: {
    blocksCompleted: string[];
    completionPercent: number;
    assignmentUnlocked: boolean;
  };
}

/**
 * Tutorial Engine
 * 
 * Core orchestration layer for tutorial operations.
 * Handles brand filtering, content delivery, and progress tracking.
 * 
 * Pattern: Singleton with dependency injection (same as ExamEngine)
 */
export class TutorialEngine {
  private static singleton: TutorialEngine | null = null;
  private log = logger.child({ module: 'tutorial-engine' });
  private contentRepo: TutorialContentRepository;
  private progressRepo: TutorialProgressRepository;

  constructor() {
    this.contentRepo = this.resolveToken(
      TOKENS.TutorialContentRepository,
      () => new TutorialContentRepository(),
      (value) => typeof (value as TutorialContentRepository).getPublished === 'function'
    );
    this.progressRepo = this.resolveToken(
      TOKENS.TutorialProgressRepository,
      () => new TutorialProgressRepository(),
      (value) => typeof (value as TutorialProgressRepository).getProgress === 'function'
    );
  }

  private resolveToken<T>(token: string, fallback: () => T, validate?: (value: T) => boolean): T {
    try {
      const resolved = container.get<T>(token);
      if (resolved === undefined || resolved === null) return fallback();
      if (validate && !validate(resolved)) return fallback();
      return resolved;
    } catch {
      return fallback();
    }
  }

  private static getInstance() {
    if (this.singleton === null) this.singleton = new TutorialEngine();
    return this.singleton;
  }

  /**
   * Get tutorial content with brand filtering and customizations
   * 
   * @param options - Content retrieval options
   * @returns Tutorial content with brand-specific customizations
   */
  async getTutorialContent(options: TutorialContentOptions): Promise<TutorialContent | null> {
    const { subtopicId, userId, brandId, difficulty = 'simple', includeProgress = true } = options;

    this.log.info({ subtopicId, userId, brandId, difficulty }, 'Getting tutorial content');

    try {
      // 1. Validate brand access to tutorial
      const hasAccess = await this.validateBrandAccess(subtopicId, brandId);
      if (!hasAccess) {
        this.log.warn({ subtopicId, brandId }, 'Brand access denied');
        throw new Error(`Tutorial not accessible to brand: ${brandId}`);
      }

      // 2. Get tutorial content with brand filtering
      const content = await this.contentRepo.getPublished(subtopicId, difficulty || undefined);
      if (!content || content.length === 0) {
        this.log.warn({ subtopicId, difficulty }, 'Tutorial content not found');
        return null;
      }

      const tutorialContent = content[0];

      // 3. Apply brand-specific customizations
      const customized = this.applyBrandCustomizations(tutorialContent, brandId);

      // 4. Get user progress if requested
      let progress;
      if (includeProgress) {
        const progressData = await this.progressRepo.getProgress(userId, subtopicId);
        progress = this.formatProgress(progressData);
      }

      this.log.info({ subtopicId, brandId, hasProgress: !!progress }, 'Tutorial content retrieved');

      return {
        id: tutorialContent.id,
        subtopicId: tutorialContent.subtopicId,
        brandId: brandId,
        difficulty: tutorialContent.difficulty,
        content: customized.content,
        brandCustomizations: customized.brandCustomizations,
        progress
      };
    } catch (error) {
      this.log.error({ error, subtopicId, brandId }, 'Failed to get tutorial content');
      throw error;
    }
  }

  /**
   * Track user progress with brand context
   * 
   * @param options - Progress tracking options
   * @returns Updated progress information
   */
  async trackProgress(options: TutorialProgressOptions) {
    const { userId, subtopicId, blockType, brandId } = options;

    this.log.info({ userId, subtopicId, blockType, brandId }, 'Tracking progress');

    try {
      // 1. Validate brand access
      const hasAccess = await this.validateBrandAccess(subtopicId, brandId);
      if (!hasAccess) {
        this.log.warn({ subtopicId, brandId }, 'Brand access denied for progress tracking');
        throw new Error(`Tutorial not accessible to brand: ${brandId}`);
      }

      // 2. Mark block as complete
      const progress = await this.progressRepo.markBlockComplete(userId, subtopicId, blockType);

      // 3. Check if remediation needed
      if (this.needsRemediation(progress)) {
        this.log.info({ userId, subtopicId }, 'Triggering remediation');
        await this.triggerRemediation(userId, subtopicId, brandId);
      }

      // 4. Format and return progress
      const formatted = this.formatProgress(progress);
      
      this.log.info({ userId, subtopicId, completionPercent: formatted.completionPercent }, 'Progress tracked');

      return formatted;
    } catch (error) {
      this.log.error({ error, userId, subtopicId, blockType }, 'Failed to track progress');
      throw error;
    }
  }

  /**
   * Validate brand has access to tutorial
   * 
   * Checks:
   * - Shared content is accessible to all brands
   * - Brand-exclusive content is only accessible to that brand
   * - Brand visibility rules are enforced
   */
  private async validateBrandAccess(
    subtopicId: string,
    brandId: TutorialBrand
  ): Promise<boolean> {
    // For now, allow all access
    // TODO: Implement proper brand visibility checks using tutorial_sections.brandId
    // and tutorial_sections.brandVisibility columns
    // 
    // Logic should be:
    // 1. Query tutorial_sections for subtopicId
    // 2. Check brandId column
    // 3. If brandId === 'shared' → allow all
    // 4. If brandVisibility === 'shared_visible' → allow all
    // 5. If brandVisibility === 'brand_exclusive' → only allow matching brand
    
    return true;
  }

  /**
   * Apply brand-specific customizations to content
   * 
   * Merges brand customizations from brandCustomizations JSON field
   */
  private applyBrandCustomizations(content: any, brandId: TutorialBrand) {
    // If content has brand customizations, apply them
    if (content.brandCustomizations && Array.isArray(content.brandCustomizations)) {
      const brandCustomization = content.brandCustomizations.find(
        (custom: any) => custom.brandId === brandId
      );

      if (brandCustomization) {
        this.log.debug({ brandId, hasCustomization: true }, 'Applying brand customizations');
        
        return {
          ...content,
          content: {
            ...content.content,
            ...brandCustomization.customContent
          },
          brandCustomizations: brandCustomization
        };
      }
    }

    return content;
  }

  /**
   * Format progress data for API response
   */
  private formatProgress(progress: any) {
    if (!progress) {
      return {
        blocksCompleted: [],
        completionPercent: 0,
        assignmentUnlocked: false
      };
    }

    const blocksCompleted = progress.blocksCompleted || [];
    const requiredBlocks = 6; // notes, layman, real_life, technical, code, ai_tutor
    const completionPercent = Math.round((blocksCompleted.length / requiredBlocks) * 100);
    const assignmentUnlocked = progress.status === 'completed';

    return {
      blocksCompleted,
      completionPercent,
      assignmentUnlocked
    };
  }

  /**
   * Check if user needs remediation
   */
  private needsRemediation(progress: any): boolean {
    // TODO: Implement remediation logic
    // Check if user is struggling based on progress patterns
    return false;
  }

  /**
   * Trigger remediation for struggling user
   */
  private async triggerRemediation(
    userId: string,
    subtopicId: string,
    brandId: TutorialBrand
  ): Promise<void> {
    // TODO: Implement remediation triggering
    // Create remediation record, notify user, etc.
    this.log.info({ userId, subtopicId, brandId }, 'Remediation triggered');
  }

  /**
   * Static method to get tutorial content (singleton pattern like ExamEngine)
   */
  static async getTutorialContent(options: TutorialContentOptions): Promise<TutorialContent | null> {
    const instance = this.getInstance();
    return instance.getTutorialContent(options);
  }

  /**
   * Static method to track progress (singleton pattern like ExamEngine)
   */
  static async trackProgress(options: TutorialProgressOptions) {
    const instance = this.getInstance();
    return instance.trackProgress(options);
  }
}
