/**
 * Suggestion Application Service Tests
 * 
 * Tests the complete suggestion application orchestration flow:
 * Phase B (verification) → Phase C (transformation) → Phase A (persistence)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuggestionApplicationService } from '../suggestion-application.service';
import { TutorialSectionRepository } from '../../repositories/tutorial-section.repository';
import { SuggestionVerificationService } from '../suggestion-verification.service';
import { BlockTransformationService } from '../block-transformation.service';
import type { TutorialDocument, BlockSuggestion } from '@quiz/types';
import type { TutorialSection } from '../../schema/tutorial-sections';
import {
  VersionConflictError,
  SectionNotFoundError,
  SuggestionNotFoundError,
  SuggestionFingerprintMismatchError,
  InvalidSuggestionError,
  InvalidTransformationError,
} from '@quiz/types';

const CURRENT_SCHEMA_VERSION = 1;

describe('SuggestionApplicationService', () => {
  let service: SuggestionApplicationService;
  let mockRepository: any;
  let mockVerificationService: any;
  let mockTransformationService: any;

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      getSectionById: vi.fn(),
      updateSectionWithVersion: vi.fn(),
    };

    mockVerificationService = {
      verify: vi.fn(),
    };

    mockTransformationService = {
      transform: vi.fn(),
    };

    // Create service with mocks
    service = new SuggestionApplicationService(
      mockRepository as any,
      mockVerificationService as any,
      mockTransformationService as any
    );
  });

  // ============================================================
  // SUCCESSFUL APPLICATION TESTS
  // ============================================================

  describe('applySuggestion', () => {
    it('should apply valid summary suggestion', async () => {
      // Setup
      const currentDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Introduction', level: 2 },
          },
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'Content here' },
          },
        ],
      };

      const currentSection: TutorialSection = {
        id: 'section-123',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: currentDocument as any,
        version: 5,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      const verifiedSuggestion: BlockSuggestion = {
        id: 'suggestion-summary',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Summary Block',
        preview: 'End-of-section summary',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'Document has substantial content',
        sourceBlockIds: [],
        status: 'pending',
      };

      const transformedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          ...currentDocument.blocks,
          {
            id: 'summary-1',
            type: 'summary',
            content: {
              title: 'Summary',
              points: ['Key point 1', 'Key point 2'],
            },
          },
        ],
      };

      const updatedSection: TutorialSection = {
        ...currentSection,
        content: transformedDocument as any,
        version: 6,
        updatedAt: new Date(),
      };

      // Mock Phase B verification
      mockVerificationService.verify.mockResolvedValue({
        suggestion: verifiedSuggestion,
        section: currentSection,
        fingerprint: 'valid-fingerprint',
      });

      // Mock Phase C transformation
      mockTransformationService.transform.mockReturnValue(transformedDocument);

      // Mock Phase A persistence
      mockRepository.updateSectionWithVersion.mockResolvedValue(updatedSection);

      // Execute
      const result = await service.applySuggestion({
        sectionId: 'section-123',
        suggestionId: 'suggestion-summary',
        suggestionFingerprint: 'valid-fingerprint',
        expectedVersion: 5,
      });

      // Verify
      expect(result.section.version).toBe(6);
      expect(result.previousVersion).toBe(5);
      expect(result.newVersion).toBe(6);
      expect(result.appliedSuggestionId).toBe('suggestion-summary');
      expect(result.appliedSuggestionType).toBe('summary');

      // Verify Phase B was called
      expect(mockVerificationService.verify).toHaveBeenCalledWith({
        sectionId: 'section-123',
        suggestionId: 'suggestion-summary',
        suggestionFingerprint: 'valid-fingerprint',
        expectedVersion: 5,
      });

      // Verify Phase C was called with current document and verified suggestion
      expect(mockTransformationService.transform).toHaveBeenCalledWith(
        currentDocument,
        verifiedSuggestion
      );

      // Verify Phase A was called with expectedVersion
      expect(mockRepository.updateSectionWithVersion).toHaveBeenCalledWith(
        'section-123',
        5,
        { content: transformedDocument }
      );
    });

    it('should apply valid callout suggestion', async () => {
      const currentDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'Important: This is critical information' },
          },
        ],
      };

      const currentSection: TutorialSection = {
        id: 'section-456',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: currentDocument as any,
        version: 3,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      const verifiedSuggestion: BlockSuggestion = {
        id: 'suggestion-callout',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout (important)',
        preview: 'Important: This is critical',
        confidence: 95,
        confidenceLevel: 'high',
        reason: 'Important indicator detected',
        sourceBlockIds: ['para-1'],
        status: 'pending',
      };

      const transformedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'callout-1',
            type: 'callout',
            content: {
              variant: 'important',
              text: 'This is critical information',
            },
          },
        ],
      };

      const updatedSection: TutorialSection = {
        ...currentSection,
        content: transformedDocument as any,
        version: 4,
      };

      mockVerificationService.verify.mockResolvedValue({
        suggestion: verifiedSuggestion,
        section: currentSection,
        fingerprint: 'callout-fingerprint',
      });

      mockTransformationService.transform.mockReturnValue(transformedDocument);
      mockRepository.updateSectionWithVersion.mockResolvedValue(updatedSection);

      const result = await service.applySuggestion({
        sectionId: 'section-456',
        suggestionId: 'suggestion-callout',
        suggestionFingerprint: 'callout-fingerprint',
        expectedVersion: 3,
      });

      expect(result.section.version).toBe(4);
      expect(result.previousVersion).toBe(3);
      expect(result.newVersion).toBe(4);
      expect(result.appliedSuggestionType).toBe('callout');
    });

    it('should apply valid concept-cards suggestion (transforms to card-grid)', async () => {
      const currentDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'h3-1',
            type: 'heading',
            content: { text: 'Strings', level: 3 },
          },
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'String details' },
          },
          {
            id: 'h3-2',
            type: 'heading',
            content: { text: 'Numbers', level: 3 },
          },
          {
            id: 'para-2',
            type: 'paragraph',
            content: { text: 'Number details' },
          },
          {
            id: 'h3-3',
            type: 'heading',
            content: { text: 'Booleans', level: 3 },
          },
        ],
      };

      const currentSection: TutorialSection = {
        id: 'section-789',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: currentDocument as any,
        version: 2,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      const verifiedSuggestion: BlockSuggestion = {
        id: 'suggestion-cards',
        kind: 'suggested',
        blockType: 'concept-cards', // Suggestion type
        title: 'Concept Cards',
        preview: '3 independent concepts',
        confidence: 62,
        confidenceLevel: 'medium',
        reason: 'Multiple independent concepts detected',
        sourceBlockIds: ['h3-1', 'h3-2', 'h3-3'],
        status: 'pending',
      };

      // Phase C transforms concept-cards → card-grid (registry type)
      const transformedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'card-grid-1',
            type: 'card-grid', // ← Registry type, NOT concept-cards
            content: {
              cards: [
                {
                  id: 'card-1',
                  title: 'Strings',
                  blocks: [
                    {
                      id: 'para-1',
                      type: 'paragraph',
                      content: { text: 'String details' },
                    },
                  ],
                },
                {
                  id: 'card-2',
                  title: 'Numbers',
                  blocks: [
                    {
                      id: 'para-2',
                      type: 'paragraph',
                      content: { text: 'Number details' },
                    },
                  ],
                },
                {
                  id: 'card-3',
                  title: 'Booleans',
                  blocks: [],
                },
              ],
            },
            presentation: {
              columns: 3,
              gap: 'normal',
            },
          },
        ],
      };

      const updatedSection: TutorialSection = {
        ...currentSection,
        content: transformedDocument as any,
        version: 3,
      };

      mockVerificationService.verify.mockResolvedValue({
        suggestion: verifiedSuggestion,
        section: currentSection,
        fingerprint: 'cards-fingerprint',
      });

      mockTransformationService.transform.mockReturnValue(transformedDocument);
      mockRepository.updateSectionWithVersion.mockResolvedValue(updatedSection);

      const result = await service.applySuggestion({
        sectionId: 'section-789',
        suggestionId: 'suggestion-cards',
        suggestionFingerprint: 'cards-fingerprint',
        expectedVersion: 2,
      });

      expect(result.section.version).toBe(3);
      expect(result.appliedSuggestionType).toBe('concept-cards'); // Original suggestion type
      // The actual document contains card-grid (verified by Phase C tests)
    });
  });

  // ============================================================
  // SECURITY TESTS
  // ============================================================

  describe('Security', () => {
    it('should use server-generated suggestion, not client input', async () => {
      const currentDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'Legitimate content' },
          },
        ],
      };

      const currentSection: TutorialSection = {
        id: 'section-sec',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: currentDocument as any,
        version: 1,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      // Server generates THIS suggestion
      const serverSuggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout',
        preview: 'Legitimate content',
        confidence: 85,
        confidenceLevel: 'high',
        reason: 'Server-generated reason',
        sourceBlockIds: ['para-1'],
        status: 'pending',
      };

      const transformedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'callout-1',
            type: 'callout',
            content: {
              variant: 'info',
              text: 'Legitimate content', // ← From source, NOT from client
            },
          },
        ],
      };

      const updatedSection: TutorialSection = {
        ...currentSection,
        content: transformedDocument as any,
        version: 2,
      };

      // Phase B returns SERVER suggestion
      mockVerificationService.verify.mockResolvedValue({
        suggestion: serverSuggestion,
        section: currentSection,
        fingerprint: 'valid-fp',
      });

      mockTransformationService.transform.mockReturnValue(transformedDocument);
      mockRepository.updateSectionWithVersion.mockResolvedValue(updatedSection);

      // Client tries to apply with malicious fingerprint, but Phase B
      // regenerates and verifies, so server suggestion is used
      await service.applySuggestion({
        sectionId: 'section-sec',
        suggestionId: 'suggestion-1',
        suggestionFingerprint: 'valid-fp',
        expectedVersion: 1,
      });

      // Verify Phase C received SERVER suggestion, not client payload
      expect(mockTransformationService.transform).toHaveBeenCalledWith(
        currentDocument,
        serverSuggestion // ← SERVER generated, not from client
      );
    });

    it('should reject tampered fingerprint', async () => {
      // Phase B detects fingerprint mismatch
      mockVerificationService.verify.mockRejectedValue(
        new SuggestionFingerprintMismatchError('suggestion-1')
      );

      await expect(
        service.applySuggestion({
          sectionId: 'section-123',
          suggestionId: 'suggestion-1',
          suggestionFingerprint: 'tampered-fingerprint',
          expectedVersion: 5,
        })
      ).rejects.toThrow(SuggestionFingerprintMismatchError);

      // Verify transformation was NOT called
      expect(mockTransformationService.transform).not.toHaveBeenCalled();

      // Verify database update was NOT called
      expect(mockRepository.updateSectionWithVersion).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // ERROR HANDLING TESTS
  // ============================================================

  describe('Error Handling', () => {
    it('should fail when suggestion not found', async () => {
      mockVerificationService.verify.mockRejectedValue(
        new SuggestionNotFoundError('unknown-suggestion')
      );

      await expect(
        service.applySuggestion({
          sectionId: 'section-123',
          suggestionId: 'unknown-suggestion',
          suggestionFingerprint: 'some-fingerprint',
          expectedVersion: 5,
        })
      ).rejects.toThrow(SuggestionNotFoundError);

      expect(mockTransformationService.transform).not.toHaveBeenCalled();
      expect(mockRepository.updateSectionWithVersion).not.toHaveBeenCalled();
    });

    it('should fail when version mismatches (early rejection)', async () => {
      // Phase B detects version mismatch
      mockVerificationService.verify.mockRejectedValue(
        new VersionConflictError(5, 6)
      );

      await expect(
        service.applySuggestion({
          sectionId: 'section-123',
          suggestionId: 'suggestion-1',
          suggestionFingerprint: 'fingerprint',
          expectedVersion: 5,
        })
      ).rejects.toThrow(VersionConflictError);

      expect(mockTransformationService.transform).not.toHaveBeenCalled();
      expect(mockRepository.updateSectionWithVersion).not.toHaveBeenCalled();
    });

    it('should fail when version conflict occurs during persistence (TOCTOU)', async () => {
      const currentDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const currentSection: TutorialSection = {
        id: 'section-toctou',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: currentDocument as any,
        version: 5,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      const verifiedSuggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Summary',
        preview: 'Summary',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'Test',
        sourceBlockIds: [],
        status: 'pending',
      };

      const transformedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'summary-1',
            type: 'summary',
            content: { points: ['Key point'] },
          },
        ],
      };

      // Phase B succeeds (version = 5)
      mockVerificationService.verify.mockResolvedValue({
        suggestion: verifiedSuggestion,
        section: currentSection,
        fingerprint: 'fp',
      });

      // Phase C succeeds
      mockTransformationService.transform.mockReturnValue(transformedDocument);

      // Phase A fails (another process updated document, version is now 6)
      // updateSectionWithVersion returns null when version mismatch
      mockRepository.updateSectionWithVersion.mockResolvedValue(null);

      // Application should fail with VersionConflictError
      await expect(
        service.applySuggestion({
          sectionId: 'section-toctou',
          suggestionId: 'suggestion-1',
          suggestionFingerprint: 'fp',
          expectedVersion: 5,
        })
      ).rejects.toThrow(VersionConflictError);
    });

    it('should fail when transformation fails', async () => {
      const currentDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const currentSection: TutorialSection = {
        id: 'section-trans',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: currentDocument as any,
        version: 1,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      const verifiedSuggestion: BlockSuggestion = {
        id: 'suggestion-bad',
        kind: 'suggested',
        blockType: 'two-column',
        title: 'Two Column',
        preview: 'Test',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'Test',
        sourceBlockIds: ['missing-block'],
        status: 'pending',
      };

      mockVerificationService.verify.mockResolvedValue({
        suggestion: verifiedSuggestion,
        section: currentSection,
        fingerprint: 'fp',
      });

      // Phase C fails (e.g., invalid source blocks)
      mockTransformationService.transform.mockImplementation(() => {
        throw new InvalidTransformationError('Missing source blocks');
      });

      await expect(
        service.applySuggestion({
          sectionId: 'section-trans',
          suggestionId: 'suggestion-bad',
          suggestionFingerprint: 'fp',
          expectedVersion: 1,
        })
      ).rejects.toThrow(InvalidTransformationError);

      // Verify database update was NOT called
      expect(mockRepository.updateSectionWithVersion).not.toHaveBeenCalled();
    });

    it('should fail when section not found', async () => {
      mockVerificationService.verify.mockRejectedValue(
        new SectionNotFoundError('missing-section')
      );

      await expect(
        service.applySuggestion({
          sectionId: 'missing-section',
          suggestionId: 'suggestion-1',
          suggestionFingerprint: 'fp',
          expectedVersion: 1,
        })
      ).rejects.toThrow(SectionNotFoundError);
    });
  });

  // ============================================================
  // ORCHESTRATION VERIFICATION TESTS
  // ============================================================

  describe('Orchestration', () => {
    it('should call services in correct order', async () => {
      const currentDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const currentSection: TutorialSection = {
        id: 'section-order',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: currentDocument as any,
        version: 1,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      const verifiedSuggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Summary',
        preview: 'Summary',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'Test',
        sourceBlockIds: [],
        status: 'pending',
      };

      const transformedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'summary-1',
            type: 'summary',
            content: { points: ['Key point'] },
          },
        ],
      };

      const updatedSection: TutorialSection = {
        ...currentSection,
        content: transformedDocument as any,
        version: 2,
      };

      const callOrder: string[] = [];

      mockVerificationService.verify.mockImplementation(async () => {
        callOrder.push('verify');
        return {
          suggestion: verifiedSuggestion,
          section: currentSection,
          fingerprint: 'fp',
        };
      });

      mockTransformationService.transform.mockImplementation(() => {
        callOrder.push('transform');
        return transformedDocument;
      });

      mockRepository.updateSectionWithVersion.mockImplementation(async () => {
        callOrder.push('persist');
        return updatedSection;
      });

      await service.applySuggestion({
        sectionId: 'section-order',
        suggestionId: 'suggestion-1',
        suggestionFingerprint: 'fp',
        expectedVersion: 1,
      });

      // Verify correct order: Phase B → Phase C → Phase A
      expect(callOrder).toEqual(['verify', 'transform', 'persist']);
    });

    it('should pass correct parameters between phases', async () => {
      const currentDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const currentSection: TutorialSection = {
        id: 'section-params',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: currentDocument as any,
        version: 10,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      const verifiedSuggestion: BlockSuggestion = {
        id: 'suggestion-params',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Summary',
        preview: 'Summary',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'Test',
        sourceBlockIds: [],
        status: 'pending',
      };

      const transformedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'summary-1',
            type: 'summary',
            content: { points: ['Key point'] },
          },
        ],
      };

      const updatedSection: TutorialSection = {
        ...currentSection,
        content: transformedDocument as any,
        version: 11,
      };

      mockVerificationService.verify.mockResolvedValue({
        suggestion: verifiedSuggestion,
        section: currentSection,
        fingerprint: 'test-fp',
      });

      mockTransformationService.transform.mockReturnValue(transformedDocument);
      mockRepository.updateSectionWithVersion.mockResolvedValue(updatedSection);

      await service.applySuggestion({
        sectionId: 'section-params',
        suggestionId: 'suggestion-params',
        suggestionFingerprint: 'test-fp',
        expectedVersion: 10,
      });

      // Verify Phase B received correct input
      expect(mockVerificationService.verify).toHaveBeenCalledWith({
        sectionId: 'section-params',
        suggestionId: 'suggestion-params',
        suggestionFingerprint: 'test-fp',
        expectedVersion: 10,
      });

      // Verify Phase C received current document + verified suggestion
      expect(mockTransformationService.transform).toHaveBeenCalledWith(
        currentDocument,
        verifiedSuggestion
      );

      // Verify Phase A received sectionId + expectedVersion + transformed content
      expect(mockRepository.updateSectionWithVersion).toHaveBeenCalledWith(
        'section-params',
        10,
        { content: transformedDocument }
      );
    });
  });

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  describe('getSectionVersion', () => {
    it('should return section version info', async () => {
      const section: TutorialSection = {
        id: 'section-ver',
        subtopicId: 'subtopic-1',
        sectionType: 'notes',
        difficulty: 'expert',
        orderIndex: 0,
        content: { schemaVersion: 1, blocks: [] } as any,
        version: 7,
        language: 'en',
        status: 'draft',
        generatedByAi: false,
        aiModelUsed: null,
        qualityScore: null,
        hallucinationScore: null,
        regenerationCount: 0,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        promptTemplateId: null,
        educationalArchitectureId: null,
        uiArchitectureId: null,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        brandCustomizations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        deletedAt: null,
        generationJobId: null,
      };

      mockRepository.getSectionById.mockResolvedValue(section);

      const result = await service.getSectionVersion('section-ver');

      expect(result).toEqual({
        version: 7,
        sectionType: 'notes',
      });
    });

    it('should return null for missing section', async () => {
      mockRepository.getSectionById.mockResolvedValue(undefined);

      const result = await service.getSectionVersion('missing');

      expect(result).toBeNull();
    });
  });
});


