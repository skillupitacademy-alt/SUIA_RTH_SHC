/**
 * Tutorial Service - Business Logic Layer
 * 
 * Handles tutorial-related business operations.
 * Similar to other service layers in the application.
 * 
 * @module tutorial-engine
 */

import { TutorialEngine } from './tutorial.engine';
import type { TutorialBrand, BlockType } from './tutorial.engine';
import type { TutorialDifficulty } from '@quiz/types';

export interface GetContentRequest {
  subtopicId: string;
  userId: string;
  brandId: TutorialBrand;
  difficulty?: TutorialDifficulty;
}

export interface TrackProgressRequest {
  userId: string;
  subtopicId: string;
  blockType: BlockType;
  brandId: TutorialBrand;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Tutorial Service
 * 
 * High-level service for tutorial operations.
 * Provides a clean API for controllers/routes.
 */
export class TutorialService {
  /**
   * Get tutorial content for a subtopic
   * 
   * Handles brand filtering and customizations
   */
  async getContent(request: GetContentRequest): Promise<ServiceResponse<any>> {
    const { subtopicId, userId, brandId, difficulty } = request;

    try {
      const content = await TutorialEngine.getTutorialContent({
        subtopicId,
        userId,
        brandId,
        difficulty,
        includeProgress: true
      });

      if (!content) {
        return {
          success: false,
          error: 'Tutorial content not found'
        };
      }

      return {
        success: true,
        data: content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tutorial content'
      };
    }
  }

  /**
   * Track user progress on a tutorial block
   * 
   * Updates progress and checks for remediation needs
   */
  async trackProgress(request: TrackProgressRequest): Promise<ServiceResponse<any>> {
    const { userId, subtopicId, blockType, brandId } = request;

    try {
      const progress = await TutorialEngine.trackProgress({
        userId,
        subtopicId,
        blockType,
        brandId
      });

      return {
        success: true,
        data: progress
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track progress'
      };
    }
  }
}
