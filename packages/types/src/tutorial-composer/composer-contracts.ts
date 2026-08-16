/**
 * Tutorial Composer Contracts
 * 
 * Contracts for the full Tutorial Composer workspace (Pages 1-10 + Page 16)
 * 
 * INPUT SOURCES:
 * 1. tutorial_composer_final_review (from Page 15)
 * 2. tutorial_composer_document (original document)
 * 3. tutorial_composer_reviewed_blocks (optional)
 * 
 * WORKFLOW:
 * Page 15 → Composer Initial Draft Generator → Composer GUI → Save Draft → Publish
 */

import { z } from 'zod';
import { TutorialDocumentSchema } from '../tutorial-rich-document';
import { BlockTypeSchema } from './presentation-ideas-contracts';

/**
 * Review Status from Page 15
 */
export const ReviewStatusSchema = z.enum(['accepted', 'modified', 'rejected', 'pending']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

/**
 * Review Modification from Page 15
 */
export const ReviewModificationSchema = z.object({
  customTitle: z.string().optional(),
  customNote: z.string().optional(),
  configOverrides: z.record(z.unknown()).optional(),
});
export type ReviewModification = z.infer<typeof ReviewModificationSchema>;

/**
 * Reviewable Suggestion Item from Page 15
 * Extends PresentationIdea with review state
 */
export const ReviewableSuggestionItemSchema = z.object({
  id: z.string(),
  reviewNumber: z.number(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  impact: z.enum(['high', 'medium', 'low']),
  sourceBlockIds: z.array(z.string()),
  targetBlockType: BlockTypeSchema,
  wireframeType: z.string(),
  reason: z.string(),
  presentationConfig: z.record(z.unknown()).optional(),
  reviewStatus: ReviewStatusSchema,
  customModification: ReviewModificationSchema.optional(),
  isSelected: z.boolean().optional(),
  status: z.string().optional(),
  isChecked: z.boolean().optional(),
});
export type ReviewableSuggestionItem = z.infer<typeof ReviewableSuggestionItemSchema>;

/**
 * Tutorial Composer Final Review
 * 
 * This is the authoritative payload from Page 15 that the Composer consumes.
 * 
 * CRITICAL AUTHORIZATION RULE:
 * - approvedSuggestions MUST contain ONLY accepted + modified items
 * - Rejected suggestions MUST NOT be present
 * - Server must recalculate and enforce this boundary
 */
export const TutorialComposerFinalReviewSchema = z.object({
  subtopicId: z.string().uuid(),
  sectionType: z.string(),
  approvedSuggestions: z.array(ReviewableSuggestionItemSchema),
  readyBlockCount: z.number().int().nonnegative(),
  completedAt: z.string().datetime(),
});
export type TutorialComposerFinalReview = z.infer<typeof TutorialComposerFinalReviewSchema>;

/**
 * Stored Tutorial Document (from sessionStorage)
 */
export const StoredTutorialDocumentSchema = z.object({
  subtopicId: z.string().uuid(),
  sectionType: z.string(),
  brandId: z.string(),
  document: TutorialDocumentSchema,
});
export type StoredTutorialDocument = z.infer<typeof StoredTutorialDocumentSchema>;

/**
 * Composer Initial Draft Request
 * 
 * Request to generate the initial Composer draft from Page 15 review output.
 * This is typically handled internally, not exposed as a public API endpoint.
 */
export const ComposerInitialDraftRequestSchema = z.object({
  finalReview: TutorialComposerFinalReviewSchema,
  originalDocument: TutorialDocumentSchema,
});
export type ComposerInitialDraftRequest = z.infer<typeof ComposerInitialDraftRequestSchema>;

/**
 * Composer Initial Draft Response
 */
export const ComposerInitialDraftResponseSchema = z.object({
  document: TutorialDocumentSchema,
  appliedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  errors: z.array(
    z.object({
      suggestionId: z.string(),
      reason: z.string(),
    })
  ),
});
export type ComposerInitialDraftResponse = z.infer<typeof ComposerInitialDraftResponseSchema>;

/**
 * Composer Auto-save Payload
 * 
 * The Composer GUI will periodically auto-save the working document.
 * This uses the existing PATCH /api/tutorial-composer/sections/:sectionId endpoint.
 */
export const ComposerAutoSavePayloadSchema = z.object({
  content: TutorialDocumentSchema,
});
export type ComposerAutoSavePayload = z.infer<typeof ComposerAutoSavePayloadSchema>;

