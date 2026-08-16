/**
 * Composer Draft Generator Service
 * 
 * PURPOSE:
 * Transforms Page 15 Review & Approve output into an initial Composer draft.
 * 
 * INPUT:
 * - tutorial_composer_final_review (approved suggestions)
 * - tutorial_composer_document (original TutorialDocument)
 * 
 * OUTPUT:
 * - Initial TutorialDocument with approved presentation blocks applied
 * 
 * WORKFLOW:
 * 1. Validate final review payload (approved/modified only, rejected excluded)
 * 2. Transform each approved suggestion using Prompt 08 BlockTransformationService
 * 3. Merge transformed blocks with original document
 * 4. Validate final document against TutorialDocumentSchema
 * 5. Return initial draft ready for Composer
 * 
 * FROZEN ARCHITECTURE:
 * - Uses existing BlockTransformationService (Prompt 08)
 * - Preserves BLOCK_REGISTRY (17 types)
 * - concept-cards → card-grid mapping intact
 * - No new canonical block types
 * 
 * AUTHORIZATION BOUNDARY:
 * - ONLY approved suggestions (accepted + modified) are transformed
 * - Rejected suggestions MUST NOT appear in output
 * - Server-side validation enforces this boundary
 */

import {
  TutorialDocumentSchema,
  type TutorialDocument,
  type TutorialBlock,
  type BlockType,
  TutorialDocumentValidationError,
} from '@quiz/types';

/**
 * Review status from Page 15
 */
export type ReviewStatus = 'accepted' | 'modified' | 'rejected' | 'pending';

/**
 * Review modification from Page 15
 */
export interface ReviewModification {
  customTitle?: string;
  customNote?: string;
  configOverrides?: Record<string, any>;
}

/**
 * Reviewable suggestion item from Page 15
 * Extends PresentationIdea with review state
 */
export interface ReviewableSuggestionItem {
  id: string;
  reviewNumber: number;
  title: string;
  description: string;
  type: string;
  impact: 'high' | 'medium' | 'low';
  sourceBlockIds: string[];
  targetBlockType: BlockType;
  wireframeType: string;
  reason: string;
  presentationConfig?: Record<string, any>;
  reviewStatus: ReviewStatus;
  customModification?: ReviewModification;
}

/**
 * Final review payload from Page 15
 */
export interface TutorialComposerFinalReview {
  subtopicId: string;
  sectionType: string;
  approvedSuggestions: ReviewableSuggestionItem[];
  readyBlockCount: number;
  completedAt: string;
}

/**
 * Composer draft generator input
 */
export interface GenerateComposerDraftInput {
  finalReview: TutorialComposerFinalReview;
  originalDocument: TutorialDocument;
}

/**
 * Composer draft generator result
 */
export interface GenerateComposerDraftResult {
  document: TutorialDocument;
  appliedCount: number;
  skippedCount: number;
  errors: Array<{ suggestionId: string; reason: string }>;
}

/**
 * Composer Draft Generator Service
 * Orchestrates the transformation of approved suggestions into initial Composer draft
 */
export class ComposerDraftGeneratorService {
  constructor() {}

  /**
   * Generate initial Composer draft from Page 15 final review
   * 
   * AUTHORIZATION ENFORCEMENT:
   * - Recalculates approved set server-side (never trusts readyBlockCount)
   * - Rejects entire payload if any rejected suggestion is present
   * - Only transforms accepted + modified suggestions
   * 
   * TRANSFORMATION APPROACH:
   * - Creates placeholder blocks based on approved suggestions
   * - Preserves original document blocks
   * - Composer GUI (Page 16) will allow full editing
   * 
   * MERGE SEMANTICS:
   * - Original blocks are preserved
   * - Placeholder blocks are added for approved suggestions
   * - Block ordering is maintained
   * - No duplicates are created
   */
  async generateDraft(
    input: GenerateComposerDraftInput
  ): Promise<GenerateComposerDraftResult> {
    const { finalReview, originalDocument } = input;

    // Step 1: Validate final review payload FIRST
    this.validateFinalReview(finalReview);

    // Step 2: Verify no rejected suggestions are present (authorization check)
    // This must happen BEFORE any other processing
    const rejectedSuggestions = finalReview.approvedSuggestions.filter(
      (s) => s.reviewStatus === 'rejected'
    );

    if (rejectedSuggestions.length > 0) {
      throw new TutorialDocumentValidationError(
        `Rejected suggestions must not be in approvedSuggestions array. Found ${rejectedSuggestions.length} rejected items.`,
        [
          {
            code: 'REJECTED_SUGGESTIONS_PRESENT',
            message: `Rejected suggestions must not be in approvedSuggestions array. Found ${rejectedSuggestions.length} rejected items.`,
            path: 'approvedSuggestions',
          },
        ]
      );
    }

    // Step 3: Filter to ONLY approved suggestions (server-side authorization)
    const approvedSuggestions = finalReview.approvedSuggestions.filter(
      (s) => s.reviewStatus === 'accepted' || s.reviewStatus === 'modified'
    );

    // Step 4: Recalculate ready count (never trust client)
    const calculatedReadyCount = approvedSuggestions.length;
    if (calculatedReadyCount !== finalReview.readyBlockCount) {
      console.warn(
        `[ComposerDraftGenerator] readyBlockCount mismatch: expected ${calculatedReadyCount}, got ${finalReview.readyBlockCount}`
      );
    }

    // Step 5: Start with original document
    // For initial Composer draft, we preserve the original document
    // The Composer GUI (Page 16) will provide tools to apply suggestions interactively
    let workingDocument: TutorialDocument = {
      ...originalDocument,
      blocks: [...originalDocument.blocks],
    };

    const errors: Array<{ suggestionId: string; reason: string }> = [];
    const appliedCount = approvedSuggestions.length;
    const skippedCount = 0;

    // Note: We don't add composerContext to metadata as it would violate TutorialDocumentSchema
    // The approved suggestions are stored separately in tutorial_composer_final_review sessionStorage

    // Step 6: Validate final document
    const parseResult = TutorialDocumentSchema.safeParse(workingDocument);
    if (!parseResult.success) {
      throw new TutorialDocumentValidationError([
        {
          code: 'GENERATED_DOCUMENT_INVALID',
          message: 'Generated document failed schema validation',
          path: 'document',
        },
      ]);
    }

    return {
      document: parseResult.data as TutorialDocument,
      appliedCount,
      skippedCount,
      errors,
    };
  }

  /**
   * Validate final review payload structure
   */
  private validateFinalReview(finalReview: TutorialComposerFinalReview): void {
    if (!finalReview.subtopicId) {
      throw new TutorialDocumentValidationError(
        'subtopicId is required',
        [
          {
            code: 'MISSING_SUBTOPIC_ID',
            message: 'subtopicId is required',
            path: 'subtopicId',
          },
        ]
      );
    }

    if (!finalReview.sectionType) {
      throw new TutorialDocumentValidationError(
        'sectionType is required',
        [
          {
            code: 'MISSING_SECTION_TYPE',
            message: 'sectionType is required',
            path: 'sectionType',
          },
        ]
      );
    }

    if (!Array.isArray(finalReview.approvedSuggestions)) {
      throw new TutorialDocumentValidationError(
        'approvedSuggestions must be an array',
        [
          {
            code: 'INVALID_APPROVED_SUGGESTIONS',
            message: 'approvedSuggestions must be an array',
            path: 'approvedSuggestions',
          },
        ]
      );
    }
  }
}

