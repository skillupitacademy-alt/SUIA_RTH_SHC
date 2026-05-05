#!/usr/bin/env tsx

/**
 * Tutorial Engine Unit Tests
 * 
 * Comprehensive unit tests for the centralized Tutorial Engine implementation.
 * Tests brand filtering, content delivery, progress tracking, and API integration.
 * 
 * Usage: npm run tsx scripts/test-tutorial-engine-unit.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock dependencies before importing
vi.mock('@quiz/db-tutorial', () => ({
  TutorialContentRepository: vi.fn(),
  TutorialProgressRepository: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn(),
  },
}));

// Import after mocking
import { TutorialEngine } from '../apps/api-server/src/modules/tutorial-engine/tutorial.engine';
import { TutorialService } from '../apps/api-server/src/modules/tutorial-engine/tutorial.service';

describe('Tutorial Engine Unit Tests', () => {
  let mockContentRepo: any;
  let mockProgressRepo: any;
  let mockContainer: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock repositories
    mockContentRepo = {
      getPublished: vi.fn(),
    };

    mockProgressRepo = {
      getProgress: vi.fn(),
      markBlockComplete: vi.fn(),
    };

    // Setup mock container
    mockContainer = {
      get: vi.fn((token: string) => {
        if (token === 'ITutorialContentRepository') return mockContentRepo;
        if (token === 'ITutorialProgressRepository') return mockProgressRepo;
        throw new Error(`Unknown token: ${token}`);
      }),
    };

    // Mock container.get
    const { container } = require('@/modules/core/container');
    container.get.mockImplementation(mockContainer.get);
  });

  afterEach(() => {
    // Reset singleton instance
    (TutorialEngine as any).singleton = null;
  });

  describe('TutorialEngine Core Functionality', () => {
    it('should get tutorial content with brand filtering', async () => {
      // Arrange
      const mockContent = [{
        id: 'content-1',
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        content: { notes: 'Test content' },
        brandCustomizations: [
          {
            brandId: 'realtutorialhub',
            customContent: { notes: 'RTH custom content' }
          }
        ]
      }];

      mockContentRepo.getPublished.mockResolvedValue(mockContent);
      mockProgressRepo.getProgress.mockResolvedValue({
        blocksCompleted: ['notes'],
        status: 'in_progress'
      });

      // Act
      const result = await TutorialEngine.getTutorialContent({
        subtopicId: 'subtopic-1',
        userId: 'user-1',
        brandId: 'realtutorialhub',
        difficulty: 'simple',
        includeProgress: true
      });

      // Assert
      expect(result).toBeDefined();
      expect(result?.subtopicId).toBe('subtopic-1');
      expect(result?.brandId).toBe('realtutorialhub');
      expect(result?.content.notes).toBe('RTH custom content'); // Brand customization applied
      expect(result?.progress?.blocksCompleted).toEqual(['notes']);
      expect(mockContentRepo.getPublished).toHaveBeenCalledWith('subtopic-1', 'simple');
    });

    it('should handle missing content gracefully', async () => {
      // Arrange
      mockContentRepo.getPublished.mockResolvedValue([]);

      // Act
      const result = await TutorialEngine.getTutorialContent({
        subtopicId: 'nonexistent',
        userId: 'user-1',
        brandId: 'realtutorialhub',
        difficulty: 'simple'
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should track progress with brand context', async () => {
      // Arrange
      const mockProgress = {
        blocksCompleted: ['notes', 'layman'],
        status: 'in_progress'
      };

      mockProgressRepo.markBlockComplete.mockResolvedValue(mockProgress);

      // Act
      const result = await TutorialEngine.trackProgress({
        userId: 'user-1',
        subtopicId: 'subtopic-1',
        blockType: 'layman',
        brandId: 'skillup'
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.blocksCompleted).toEqual(['notes', 'layman']);
      expect(result.completionPercent).toBe(33); // 2/6 blocks = 33%
      expect(mockProgressRepo.markBlockComplete).toHaveBeenCalledWith('user-1', 'subtopic-1', 'layman');
    });

    it('should apply brand customizations correctly', async () => {
      // Arrange
      const mockContent = [{
        id: 'content-1',
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        content: { notes: 'Default content' },
        brandCustomizations: [
          {
            brandId: 'skillup',
            customContent: { notes: 'SkillUp custom content' }
          },
          {
            brandId: 'realtutorialhub',
            customContent: { notes: 'RTH custom content' }
          }
        ]
      }];

      mockContentRepo.getPublished.mockResolvedValue(mockContent);

      // Act - Test SkillUp brand
      const skillupResult = await TutorialEngine.getTutorialContent({
        subtopicId: 'subtopic-1',
        userId: 'user-1',
        brandId: 'skillup',
        difficulty: 'simple',
        includeProgress: false
      });

      // Assert
      expect(skillupResult?.content.notes).toBe('SkillUp custom content');
    });

    it('should handle progress calculation correctly', async () => {
      // Arrange
      const testCases = [
        { blocksCompleted: [], expectedPercent: 0 },
        { blocksCompleted: ['notes'], expectedPercent: 17 }, // 1/6 = 16.67% -> 17%
        { blocksCompleted: ['notes', 'layman', 'real_life'], expectedPercent: 50 }, // 3/6 = 50%
        { blocksCompleted: ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'], expectedPercent: 100 }, // 6/6 = 100%
      ];

      for (const testCase of testCases) {
        mockProgressRepo.markBlockComplete.mockResolvedValue({
          blocksCompleted: testCase.blocksCompleted,
          status: testCase.blocksCompleted.length === 6 ? 'completed' : 'in_progress'
        });

        // Act
        const result = await TutorialEngine.trackProgress({
          userId: 'user-1',
          subtopicId: 'subtopic-1',
          blockType: 'notes',
          brandId: 'realtutorialhub'
        });

        // Assert
        expect(result.completionPercent).toBe(testCase.expectedPercent);
        expect(result.assignmentUnlocked).toBe(testCase.blocksCompleted.length === 6);
      }
    });
  });

  describe('TutorialService Integration', () => {
    let tutorialService: TutorialService;

    beforeEach(() => {
      tutorialService = new TutorialService();
    });

    it('should handle successful content retrieval', async () => {
      // Arrange
      const mockContent = [{
        id: 'content-1',
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        content: { notes: 'Test content' }
      }];

      mockContentRepo.getPublished.mockResolvedValue(mockContent);

      // Act
      const result = await tutorialService.getContent({
        subtopicId: 'subtopic-1',
        userId: 'user-1',
        brandId: 'realtutorialhub',
        difficulty: 'simple'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle content not found', async () => {
      // Arrange
      mockContentRepo.getPublished.mockResolvedValue([]);

      // Act
      const result = await tutorialService.getContent({
        subtopicId: 'nonexistent',
        userId: 'user-1',
        brandId: 'realtutorialhub'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Tutorial content not found');
      expect(result.data).toBeUndefined();
    });

    it('should handle progress tracking errors', async () => {
      // Arrange
      mockProgressRepo.markBlockComplete.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await tutorialService.trackProgress({
        userId: 'user-1',
        subtopicId: 'subtopic-1',
        blockType: 'notes',
        brandId: 'realtutorialhub'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.data).toBeUndefined();
    });
  });

  describe('Brand Filtering Logic', () => {
    it('should validate brand access (placeholder)', async () => {
      // This test validates the brand access logic
      // Currently returns true, but should implement proper validation
      
      const mockContent = [{
        id: 'content-1',
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        content: { notes: 'Test content' }
      }];

      mockContentRepo.getPublished.mockResolvedValue(mockContent);

      // Test both brands can access content
      const rthResult = await TutorialEngine.getTutorialContent({
        subtopicId: 'subtopic-1',
        userId: 'user-1',
        brandId: 'realtutorialhub',
        difficulty: 'simple',
        includeProgress: false
      });

      const skillupResult = await TutorialEngine.getTutorialContent({
        subtopicId: 'subtopic-1',
        userId: 'user-1',
        brandId: 'skillup',
        difficulty: 'simple',
        includeProgress: false
      });

      expect(rthResult).toBeDefined();
      expect(skillupResult).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockContentRepo.getPublished.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(TutorialEngine.getTutorialContent({
        subtopicId: 'subtopic-1',
        userId: 'user-1',
        brandId: 'realtutorialhub'
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle progress tracking errors', async () => {
      // Arrange
      mockProgressRepo.markBlockComplete.mockRejectedValue(new Error('Progress update failed'));

      // Act & Assert
      await expect(TutorialEngine.trackProgress({
        userId: 'user-1',
        subtopicId: 'subtopic-1',
        blockType: 'notes',
        brandId: 'realtutorialhub'
      })).rejects.toThrow('Progress update failed');
    });
  });
});

// Run the tests
if (import.meta.vitest) {
  console.log('🧪 Running Tutorial Engine Unit Tests...');
  
  // Test results will be handled by vitest
  console.log('✅ Tutorial Engine unit tests completed');
  console.log('📊 Check test output above for detailed results');
}

export {};