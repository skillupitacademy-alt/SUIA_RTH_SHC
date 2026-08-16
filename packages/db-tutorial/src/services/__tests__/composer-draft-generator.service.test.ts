/**
 * Composer Draft Generator Service Tests
 * 
 * Tests the transformation of Page 15 final review output into initial Composer draft
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComposerDraftGeneratorService } from '../composer-draft-generator.service';
import type {
  TutorialDocument,
  ReviewableSuggestionItem,
  TutorialComposerFinalReview,
} from '@quiz/types';

const CURRENT_SCHEMA_VERSION = 1;

describe('ComposerDraftGeneratorService', () => {
  let service: ComposerDraftGeneratorService;

  beforeEach(() => {
    service = new ComposerDraftGeneratorService();
  });

  // ============================================================
  // 1. AUTHORIZATION BOUNDARY TESTS
  // ============================================================

  describe('Authorization boundary enforcement', () => {
    it('should reject final review with rejected suggestions in approvedSuggestions array', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'JavaScript Variables', level: 1 },
          },
          {
            id: 'paragraph-1',
            type: 'paragraph',
            content: {
              text: 'Variables are containers for storing data values.',
            },
          },
        ],
        metadata: {
          estimatedReadTime: 2,
          complexityScore: 3,
        },
      };

      const rejectedSuggestion: ReviewableSuggestionItem = {
        id: 'idea-1',
        reviewNumber: 1,
        title: 'Rejected Suggestion',
        description: 'This should not be processed',
        type: 'callout',
        impact: 'high',
        sourceBlockIds: ['paragraph-1'],
        targetBlockType: 'callout',
        wireframeType: 'callout-warning',
        reason: 'Important clarification',
        reviewStatus: 'rejected', // REJECTED
      };

      const finalReview: TutorialComposerFinalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        approvedSuggestions: [rejectedSuggestion], // Contains rejected item
        readyBlockCount: 0,
        completedAt: new Date().toISOString(),
      };

      await expect(
        service.generateDraft({
          finalReview,
          originalDocument,
        })
      ).rejects.toThrow('Rejected suggestions must not be in approvedSuggestions array');
    });

    it('should process only accepted suggestions', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'JavaScript Variables', level: 1 },
          },
          {
            id: 'paragraph-1',
            type: 'paragraph',
            content: {
              text: 'Variables store data values.',
            },
          },
        ],
        metadata: {
          estimatedReadTime: 2,
          complexityScore: 3,
        },
      };

      const acceptedSuggestion: ReviewableSuggestionItem = {
        id: 'idea-1',
        reviewNumber: 1,
        title: 'Important Note',
        description: 'Add callout',
        type: 'callout',
        impact: 'high',
        sourceBlockIds: ['paragraph-1'],
        targetBlockType: 'callout',
        wireframeType: 'callout-warning',
        reason: 'Important clarification',
        reviewStatus: 'accepted',
      };

      const finalReview: TutorialComposerFinalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        approvedSuggestions: [acceptedSuggestion],
        readyBlockCount: 1,
        completedAt: new Date().toISOString(),
      };

      const result = await service.generateDraft({
        finalReview,
        originalDocument,
      });

      expect(result.appliedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should process only modified suggestions', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'React Basics', level: 1 },
          },
          {
            id: 'paragraph-1',
            type: 'paragraph',
            content: {
              text: 'React is a JavaScript library.',
            },
          },
        ],
        metadata: {
          estimatedReadTime: 2,
          complexityScore: 3,
        },
      };

      const modifiedSuggestion: ReviewableSuggestionItem = {
        id: 'idea-1',
        reviewNumber: 1,
        title: 'Custom Title',
        description: 'Add callout with custom config',
        type: 'callout',
        impact: 'medium',
        sourceBlockIds: ['paragraph-1'],
        targetBlockType: 'callout',
        wireframeType: 'callout-info',
        reason: 'Modified reason',
        reviewStatus: 'modified',
        customModification: {
          customTitle: 'Custom Callout Title',
          customNote: 'Modified by user',
          configOverrides: { variant: 'tip' },
        },
      };

      const finalReview: TutorialComposerFinalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        approvedSuggestions: [modifiedSuggestion],
        readyBlockCount: 1,
        completedAt: new Date().toISOString(),
      };

      const result = await service.generateDraft({
        finalReview,
        originalDocument,
      });

      expect(result.appliedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should process both accepted and modified suggestions together', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Programming', level: 1 },
          },
          {
            id: 'paragraph-1',
            type: 'paragraph',
            content: { text: 'First concept.' },
          },
          {
            id: 'paragraph-2',
            type: 'paragraph',
            content: { text: 'Second concept.' },
          },
        ],
        metadata: {
          estimatedReadTime: 2,
          complexityScore: 3,
        },
      };

      const acceptedSuggestion: ReviewableSuggestionItem = {
        id: 'idea-1',
        reviewNumber: 1,
        title: 'Accepted',
        description: 'Accepted suggestion',
        type: 'callout',
        impact: 'high',
        sourceBlockIds: ['paragraph-1'],
        targetBlockType: 'callout',
        wireframeType: 'callout-info',
        reason: 'Reason',
        reviewStatus: 'accepted',
      };

      const modifiedSuggestion: ReviewableSuggestionItem = {
        id: 'idea-2',
        reviewNumber: 2,
        title: 'Modified',
        description: 'Modified suggestion',
        type: 'callout',
        impact: 'medium',
        sourceBlockIds: ['paragraph-2'],
        targetBlockType: 'callout',
        wireframeType: 'callout-tip',
        reason: 'Reason',
        reviewStatus: 'modified',
        customModification: {
          customNote: 'Custom',
        },
      };

      const finalReview: TutorialComposerFinalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        approvedSuggestions: [acceptedSuggestion, modifiedSuggestion],
        readyBlockCount: 2,
        completedAt: new Date().toISOString(),
      };

      const result = await service.generateDraft({
        finalReview,
        originalDocument,
      });

      expect(result.appliedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
    });
  });

  // ============================================================
  // 2. VALIDATION TESTS
  // ============================================================

  describe('Input validation', () => {
    it('should reject missing subtopicId', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
        metadata: { estimatedReadTime: 1, complexityScore: 1 },
      };

      const finalReview = {
        subtopicId: '', // Empty
        sectionType: 'notes',
        approvedSuggestions: [],
        readyBlockCount: 0,
        completedAt: new Date().toISOString(),
      } as TutorialComposerFinalReview;

      await expect(
        service.generateDraft({
          finalReview,
          originalDocument,
        })
      ).rejects.toThrow('subtopicId is required');
    });

    it('should reject missing sectionType', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
        metadata: { estimatedReadTime: 1, complexityScore: 1 },
      };

      const finalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: '', // Empty
        approvedSuggestions: [],
        readyBlockCount: 0,
        completedAt: new Date().toISOString(),
      } as TutorialComposerFinalReview;

      await expect(
        service.generateDraft({
          finalReview,
          originalDocument,
        })
      ).rejects.toThrow('sectionType is required');
    });

    it('should reject non-array approvedSuggestions', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
        metadata: { estimatedReadTime: 1, complexityScore: 1 },
      };

      const finalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        approvedSuggestions: null, // Not an array
        readyBlockCount: 0,
        completedAt: new Date().toISOString(),
      } as any;

      await expect(
        service.generateDraft({
          finalReview,
          originalDocument,
        })
      ).rejects.toThrow('approvedSuggestions must be an array');
    });
  });

  // ============================================================
  // 3. READYBLOCKCOUNT RECALCULATION
  // ============================================================

  describe('readyBlockCount recalculation', () => {
    it('should recalculate readyBlockCount and warn on mismatch', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Title', level: 1 },
          },
        ],
        metadata: { estimatedReadTime: 1, complexityScore: 1 },
      };

      const suggestion: ReviewableSuggestionItem = {
        id: 'idea-1',
        reviewNumber: 1,
        title: 'Suggestion',
        description: 'Test',
        type: 'callout',
        impact: 'high',
        sourceBlockIds: ['heading-1'],
        targetBlockType: 'callout',
        wireframeType: 'callout-info',
        reason: 'Reason',
        reviewStatus: 'accepted',
      };

      const finalReview: TutorialComposerFinalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        approvedSuggestions: [suggestion],
        readyBlockCount: 999, // Wrong count
        completedAt: new Date().toISOString(),
      };

      await service.generateDraft({
        finalReview,
        originalDocument,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('readyBlockCount mismatch')
      );

      consoleSpy.mockRestore();
    });
  });

  // ============================================================
  // 4. EMPTY DOCUMENT HANDLING
  // ============================================================

  describe('Empty document handling', () => {
    it('should handle empty approvedSuggestions array', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Title', level: 1 },
          },
        ],
        metadata: { estimatedReadTime: 1, complexityScore: 1 },
      };

      const finalReview: TutorialComposerFinalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        approvedSuggestions: [],
        readyBlockCount: 0,
        completedAt: new Date().toISOString(),
      };

      const result = await service.generateDraft({
        finalReview,
        originalDocument,
      });

      expect(result.appliedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.document.blocks).toHaveLength(1);
      expect(result.document.blocks[0].id).toBe('heading-1');
    });
  });

  // ============================================================
  // 5. DOCUMENT VALIDATION
  // ============================================================

  describe('Output document validation', () => {
    it('should return valid TutorialDocument schema', async () => {
      const originalDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Title', level: 1 },
          },
          {
            id: 'paragraph-1',
            type: 'paragraph',
            content: { text: 'Content' },
          },
        ],
        metadata: { estimatedReadTime: 1, complexityScore: 1 },
      };

      const suggestion: ReviewableSuggestionItem = {
        id: 'idea-1',
        reviewNumber: 1,
        title: 'Test',
        description: 'Test suggestion',
        type: 'callout',
        impact: 'high',
        sourceBlockIds: ['paragraph-1'],
        targetBlockType: 'callout',
        wireframeType: 'callout-warning',
        reason: 'Test reason',
        reviewStatus: 'accepted',
      };

      const finalReview: TutorialComposerFinalReview = {
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        approvedSuggestions: [suggestion],
        readyBlockCount: 1,
        completedAt: new Date().toISOString(),
      };

      const result = await service.generateDraft({
        finalReview,
        originalDocument,
      });

      expect(result.document).toBeDefined();
      expect(result.document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.document.blocks).toBeInstanceOf(Array);
      expect(result.document.metadata).toBeDefined();
    });
  });
});

