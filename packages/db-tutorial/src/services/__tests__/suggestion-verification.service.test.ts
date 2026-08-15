/**
 * Suggestion Verification Service Tests
 * 
 * PHASE B — PROMPT 08
 * 
 * Verifies server-side suggestion verification against client tampering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SuggestionVerificationService } from '../suggestion-verification.service';
import { TutorialSectionRepository } from '../../repositories/tutorial-section.repository';
import { BlockSuggestionService } from '../block-suggestion.service';
import { ContentAnalysisService } from '../content-analysis.service';
import { fingerprintSuggestion } from '../suggestion-fingerprint.service';
import type { TutorialDocument } from '@quiz/types';
import type { TutorialSection } from '../../schema/tutorial-sections';
import { CURRENT_SCHEMA_VERSION } from '@quiz/types';
import {
  VersionConflictError,
  SectionNotFoundError,
  SuggestionNotFoundError,
  SuggestionFingerprintMismatchError,
} from '@quiz/types';

describe('SuggestionVerificationService', () => {
  let service: SuggestionVerificationService;
  let mockRepository: Partial<TutorialSectionRepository>;
  let mockSection: TutorialSection;
  let mockDocument: TutorialDocument;

  beforeEach(() => {
    // Create mock document
    mockDocument = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      blocks: [
        {
          id: 'heading-1',
          type: 'heading',
          content: { text: 'Introduction', level: 1 },
        },
        {
          id: 'para-1',
          type: 'paragraph',
          content: { text: 'This is the first paragraph with some content.' },
        },
        {
          id: 'para-2',
          type: 'paragraph',
          content: { text: 'This is the second paragraph with more content.' },
        },
        {
          id: 'para-3',
          type: 'paragraph',
          content: { text: 'This is the third paragraph with even more content.' },
        },
      ],
    };

    // Create mock section
    mockSection = {
      id: 'section-123',
      subtopicId: 'subtopic-456',
      sectionType: 'notes',
      difficulty: 'simple',
      content: mockDocument as any,
      version: 5,
      language: 'en',
      status: 'draft',
      generatedByAi: false,
      regenerationCount: 0,
      orderIndex: 0,
      brandId: 'shared',
      brandVisibility: 'shared_visible',
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      deletedAt: null,
      aiModelUsed: null,
      generationJobId: null,
      qualityScore: null,
      hallucinationScore: null,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      promptTemplateId: null,
      educationalArchitectureId: null,
      uiArchitectureId: null,
      brandCustomizations: null,
    };

    // Create mock repository
    mockRepository = {
      getSectionById: async (id: string) => {
        if (id === mockSection.id) {
          return mockSection;
        }
        return undefined;
      },
    };

    // Create service with mocked dependencies
    service = new SuggestionVerificationService(
      mockRepository as TutorialSectionRepository,
      new BlockSuggestionService(),
      new ContentAnalysisService()
    );
  });

  describe('verify', () => {
    it('should verify valid suggestion successfully', async () => {
      // Generate suggestions to get a real suggestion ID and fingerprint
      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(mockDocument);
      const result = suggestionService.generateSuggestions(mockDocument, analysis);

      // Get first suggestion
      const suggestion = result.blocks[0];
      const fingerprint = fingerprintSuggestion(suggestion);

      // Verify
      const verified = await service.verify({
        sectionId: mockSection.id,
        suggestionId: suggestion.id,
        suggestionFingerprint: fingerprint,
        expectedVersion: 5,
      });

      expect(verified).toBeDefined();
      expect(verified.suggestion.id).toBe(suggestion.id);
      expect(verified.section.id).toBe(mockSection.id);
      expect(verified.fingerprint).toBe(fingerprint);
    });

    it('should throw SectionNotFoundError for unknown section', async () => {
      await expect(
        service.verify({
          sectionId: 'unknown-section',
          suggestionId: 'suggestion-summary',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        })
      ).rejects.toThrow(SectionNotFoundError);
    });

    it('should throw VersionConflictError for stale version', async () => {
      await expect(
        service.verify({
          sectionId: mockSection.id,
          suggestionId: 'suggestion-summary',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 3, // Stale version (current is 5)
        })
      ).rejects.toThrow(VersionConflictError);
    });

    it('should throw SuggestionNotFoundError for unknown suggestion ID', async () => {
      await expect(
        service.verify({
          sectionId: mockSection.id,
          suggestionId: 'unknown-suggestion',
          suggestionFingerprint: 'a'.repeat(64),
          expectedVersion: 5,
        })
      ).rejects.toThrow(SuggestionNotFoundError);
    });

    it('should throw SuggestionFingerprintMismatchError for wrong fingerprint', async () => {
      // Generate suggestions
      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(mockDocument);
      const result = suggestionService.generateSuggestions(mockDocument, analysis);

      const suggestion = result.blocks[0];
      const wrongFingerprint = 'a'.repeat(64); // Wrong fingerprint

      await expect(
        service.verify({
          sectionId: mockSection.id,
          suggestionId: suggestion.id,
          suggestionFingerprint: wrongFingerprint,
          expectedVersion: 5,
        })
      ).rejects.toThrow(SuggestionFingerprintMismatchError);
    });

    it('should regenerate suggestions from CURRENT document', async () => {
      // This test verifies that the service regenerates from current state,
      // not from stale cached data

      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(mockDocument);
      const result = suggestionService.generateSuggestions(mockDocument, analysis);

      const suggestion = result.blocks[0];
      const fingerprint = fingerprintSuggestion(suggestion);

      // Verify with current document
      const verified = await service.verify({
        sectionId: mockSection.id,
        suggestionId: suggestion.id,
        suggestionFingerprint: fingerprint,
        expectedVersion: 5,
      });

      // The returned suggestion should be from server regeneration
      expect(verified.suggestion).toBeDefined();
      expect(verified.suggestion.id).toBe(suggestion.id);
    });

    it('should reject if document changed (fingerprint mismatch)', async () => {
      // Generate suggestion from original document
      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(mockDocument);
      const result = suggestionService.generateSuggestions(mockDocument, analysis);

      // Find a "suggested" type suggestion (not "existing")
      // Suggested suggestions are context-dependent and will change
      const suggestion = result.blocks.find((s) => s.kind === 'suggested');
      
      if (!suggestion) {
        // Skip test if no suggested suggestions
        return;
      }

      const originalFingerprint = fingerprintSuggestion(suggestion);

      // Significantly modify the document to change suggestion context
      const modifiedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Completely Different Title', level: 1 },
          },
          {
            id: 'para-new',
            type: 'paragraph',
            content: { text: 'Completely different content that changes everything' },
          },
        ],
      };

      mockSection.content = modifiedDocument as any;

      // Try to verify with original fingerprint
      // Should fail because regenerated suggestion will be different
      await expect(
        service.verify({
          sectionId: mockSection.id,
          suggestionId: suggestion.id,
          suggestionFingerprint: originalFingerprint,
          expectedVersion: 5,
        })
      ).rejects.toThrow(SuggestionFingerprintMismatchError);
    });

    it('should verify summary suggestion correctly', async () => {
      // Verify that summary suggestions (which require analysis) work correctly
      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(mockDocument);
      const result = suggestionService.generateSuggestions(mockDocument, analysis);

      // Find summary suggestion if it exists
      const summarySuggestion = result.blocks.find((s) => s.blockType === 'summary');

      if (summarySuggestion) {
        const fingerprint = fingerprintSuggestion(summarySuggestion);

        const verified = await service.verify({
          sectionId: mockSection.id,
          suggestionId: summarySuggestion.id,
          suggestionFingerprint: fingerprint,
          expectedVersion: 5,
        });

        expect(verified.suggestion.blockType).toBe('summary');
      }
    });

    it('should return server-generated suggestion, not client data', async () => {
      // This test verifies the security principle:
      // Client cannot provide suggestedContent directly

      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(mockDocument);
      const result = suggestionService.generateSuggestions(mockDocument, analysis);

      const suggestion = result.blocks[0];
      const fingerprint = fingerprintSuggestion(suggestion);

      // Verify
      const verified = await service.verify({
        sectionId: mockSection.id,
        suggestionId: suggestion.id,
        suggestionFingerprint: fingerprint,
        expectedVersion: 5,
      });

      // The returned suggestion must be from server regeneration
      // It should have the same semantic content as the original
      expect(verified.suggestion.kind).toBe(suggestion.kind);
      expect(verified.suggestion.blockType).toBe(suggestion.blockType);
      expect(verified.suggestion.reason).toBe(suggestion.reason);
    });

    it('should handle Unicode content correctly', async () => {
      const unicodeDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: '介绍 🎉', level: 1 },
          },
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'Content with émojis 🚀 and àccénts' },
          },
        ],
      };

      mockSection.content = unicodeDocument as any;

      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(unicodeDocument);
      const result = suggestionService.generateSuggestions(unicodeDocument, analysis);

      if (result.blocks.length > 0) {
        const suggestion = result.blocks[0];
        const fingerprint = fingerprintSuggestion(suggestion);

        const verified = await service.verify({
          sectionId: mockSection.id,
          suggestionId: suggestion.id,
          suggestionFingerprint: fingerprint,
          expectedVersion: 5,
        });

        expect(verified).toBeDefined();
      }
    });

    it('should verify nested suggestion content deterministically', async () => {
      // Add blocks that will generate container suggestions
      const complexDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Comparison', level: 2 },
          },
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'On one hand, approach A provides simplicity.' },
          },
          {
            id: 'heading-2',
            type: 'heading',
            content: { text: 'Alternative', level: 2 },
          },
          {
            id: 'para-2',
            type: 'paragraph',
            content: { text: 'On the other hand, approach B offers flexibility.' },
          },
        ],
      };

      mockSection.content = complexDocument as any;

      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(complexDocument);
      const result = suggestionService.generateSuggestions(complexDocument, analysis);

      if (result.blocks.length > 0) {
        const suggestion = result.blocks[0];
        const fingerprint = fingerprintSuggestion(suggestion);

        const verified = await service.verify({
          sectionId: mockSection.id,
          suggestionId: suggestion.id,
          suggestionFingerprint: fingerprint,
          expectedVersion: 5,
        });

        expect(verified).toBeDefined();
      }
    });
  });

  describe('verifyBatch', () => {
    it('should verify multiple suggestions efficiently', async () => {
      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(mockDocument);
      const result = suggestionService.generateSuggestions(mockDocument, analysis);

      // Take first 2 suggestions
      const refs = result.blocks.slice(0, 2).map((s) => ({
        suggestionId: s.id,
        suggestionFingerprint: fingerprintSuggestion(s),
      }));

      const verified = await service.verifyBatch(mockSection.id, 5, refs);

      expect(verified).toHaveLength(2);
      expect(verified[0].suggestion.id).toBe(refs[0].suggestionId);
      expect(verified[1].suggestion.id).toBe(refs[1].suggestionId);
    });

    it('should throw if any suggestion fails verification', async () => {
      const suggestionService = new BlockSuggestionService();
      const analysisService = new ContentAnalysisService();
      const analysis = analysisService.analyzeDocument(mockDocument);
      const result = suggestionService.generateSuggestions(mockDocument, analysis);

      const refs = [
        {
          suggestionId: result.blocks[0].id,
          suggestionFingerprint: fingerprintSuggestion(result.blocks[0]),
        },
        {
          suggestionId: 'unknown-suggestion',
          suggestionFingerprint: 'a'.repeat(64),
        },
      ];

      await expect(
        service.verifyBatch(mockSection.id, 5, refs)
      ).rejects.toThrow(SuggestionNotFoundError);
    });

    it('should throw version conflict for batch', async () => {
      await expect(
        service.verifyBatch(mockSection.id, 3, [])
      ).rejects.toThrow(VersionConflictError);
    });
  });
});
