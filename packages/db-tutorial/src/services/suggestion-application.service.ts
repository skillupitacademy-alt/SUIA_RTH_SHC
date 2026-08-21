/**
 * Suggestion Application Service
 * 
 * PHASE D — PROMPT 08
 * 
 * PURPOSE:
 * Orchestrates the complete suggestion application flow:
 * Phase A (repository) → Phase B (verification) → Phase C (transformation) → atomic persistence
 * 
 * RESPONSIBILITY:
 * "How do we safely apply a verified suggestion to the current TutorialDocument
 * and persist the result atomically?"
 * 
 * SECURITY ARCHITECTURE:
 * - Client provides: sectionId, suggestionId, fingerprint, expectedVersion
 * - Server loads current section
 * - Phase B: Server regenerates and verifies suggestion
 * - Phase C: Server transforms to canonical TutorialBlock
 * - Schema validation ensures document integrity
 * - Phase A: Atomic database update with version check
 * 
 * CRITICAL: This service does NOT:
 * - Generate new suggestions
 * - Accept client suggestedContent
 * - Bypass fingerprint verification
 * - Bypass optimistic concurrency
 * - Create audit tables
 * - Implement rejection logic
 * - Implement caching
 * - Implement API routes
 * 
 * WORKFLOW:
 * 1. Phase B: Verify suggestion (regenerate + fingerprint check + version check)
 * 2. Phase C: Transform verified suggestion → canonical TutorialDocument
 * 3. Validate: TutorialDocumentSchema.parse()
 * 4. Phase A: updateTutorialContentWithVersion() for atomic persistence
 * 5. Return: Updated section with new version
 * 
 * ERROR HANDLING:
 * - SectionNotFoundError: Section doesn't exist
 * - VersionConflictError: expectedVersion doesn't match current
 * - SuggestionNotFoundError: Suggestion ID not found in regenerated set
 * - SuggestionFingerprintMismatchError: Fingerprint mismatch
 * - InvalidSuggestionError: Suggestion cannot be applied
 * - InvalidTransformationError: Transformation failed
 * 
 * TOCTOU PROTECTION:
 * Even if version check passes in Phase B, the final database UPDATE
 * may still fail if another process modifies the document between
 * verification and persistence. This is EXPECTED and returns VersionConflictError.
 */

import type { TutorialSection } from '../schema/tutorial-sections';
import {
  VersionConflictError,
  SectionNotFoundError,
  TutorialDocumentSchema,
} from '@quiz/types';
import { TutorialSectionRepository } from '../repositories/tutorial-section.repository';
import { SuggestionVerificationService } from './suggestion-verification.service';
import { BlockTransformationService } from './block-transformation.service';

/**
 * Input for applying a suggestion
 * 
 * Client provides ONLY identifiers and verification data.
 * Server generates all content from authoritative sources.
 */
export interface ApplySuggestionInput {
  /**
   * Section ID to apply suggestion to
   */
  sectionId: string;

  /**
   * Suggestion ID (from server-generated suggestion set)
   */
  suggestionId: string;

  /**
   * Suggestion fingerprint for verification
   * Must match server-generated fingerprint from current document
   */
  suggestionFingerprint: string;

  /**
   * Expected section version for optimistic concurrency
   */
  expectedVersion: number;
}

/**
 * Result of applying a suggestion
 */
export interface ApplySuggestionResult {
  /**
   * Updated section with new version and transformed content
   */
  section: TutorialSection;

  /**
   * Version before the update
   */
  previousVersion: number;

  /**
   * New version after the update
   */
  newVersion: number;

  /**
   * Suggestion ID that was applied
   */
  appliedSuggestionId: string;

  /**
   * Type of suggestion that was applied
   */
  appliedSuggestionType: string;
}

/**
 * Suggestion Application Service
 * 
 * Orchestrates safe application of verified suggestions to TutorialDocuments.
 */
export class SuggestionApplicationService {
  private sectionRepository: TutorialSectionRepository;
  private verificationService: SuggestionVerificationService;
  private transformationService: BlockTransformationService;

  constructor(
    sectionRepository?: TutorialSectionRepository,
    verificationService?: SuggestionVerificationService,
    transformationService?: BlockTransformationService
  ) {
    this.sectionRepository = sectionRepository || new TutorialSectionRepository();
    this.verificationService = verificationService || new SuggestionVerificationService();
    this.transformationService = transformationService || new BlockTransformationService();
  }

  /**
   * Apply a suggestion to a TutorialSection
   * 
   * This method orchestrates the complete suggestion application flow:
   * 1. Verify suggestion (Phase B)
   * 2. Transform to canonical document (Phase C)
   * 3. Validate document schema
   * 4. Persist atomically with version check (Phase A)
   * 
   * @param input - Application input with identifiers only
   * @returns Application result with updated section
   * @throws {SectionNotFoundError} Section does not exist
   * @throws {VersionConflictError} Version mismatch (concurrent modification)
   * @throws {SuggestionNotFoundError} Suggestion ID not found
   * @throws {SuggestionFingerprintMismatchError} Fingerprint mismatch
   * @throws {InvalidSuggestionError} Suggestion cannot be applied
   * @throws {InvalidTransformationError} Transformation failed
   * 
   * @example
   * ```ts
   * const result = await service.applySuggestion({
   *   sectionId: 'section-123',
   *   suggestionId: 'suggestion-summary',
   *   suggestionFingerprint: 'a3f5e7...',
   *   expectedVersion: 5
   * });
   * 
   * console.log(`Version ${result.previousVersion} → ${result.newVersion}`);
   * console.log(`Applied: ${result.appliedSuggestionType}`);
   * ```
   */
  async applySuggestion(input: ApplySuggestionInput): Promise<ApplySuggestionResult> {
    // =================================================================
    // STEP 1: PHASE B — Verify suggestion
    // =================================================================
    // This performs:
    // - Load current section
    // - Early version check (early rejection)
    // - Regenerate suggestions from CURRENT document
    // - Locate suggestion by ID
    // - Verify fingerprint
    // - Return SERVER-GENERATED suggestion
    const verified = await this.verificationService.verify({
      sectionId: input.sectionId,
      suggestionId: input.suggestionId,
      suggestionFingerprint: input.suggestionFingerprint,
      expectedVersion: input.expectedVersion,
    });

    const { suggestion, section } = verified;

    // =================================================================
    // STEP 2: PHASE C — Transform suggestion to canonical document
    // =================================================================
    // This performs:
    // - Extract current TutorialDocument from section
    // - Transform suggestion to canonical TutorialBlock
    // - Mutate document (immutably)
    // - Validate with TutorialDocumentSchema
    const currentDocument = section.content as any; // TutorialDocument stored in JSONB

    const transformedDocument = this.transformationService.transform(
      currentDocument,
      suggestion
    );

    // =================================================================
    // STEP 3: SCHEMA VALIDATION
    // =================================================================
    // CRITICAL: Explicit validation at the application boundary.
    // Phase C already validates internally, but this is the final
    // trust boundary before persistence. If Phase C is bypassed or
    // modified in the future, this catches invalid documents.
    // This is defensive redundancy by design.
    const validatedDocument = TutorialDocumentSchema.parse(transformedDocument);

    // =================================================================
    // STEP 4: PHASE A — Atomic persistence with version check
    // =================================================================
    // CRITICAL: This is the final concurrency check.
    // Even though Phase B checked version, another process may have
    // modified the document between verification and now.
    // The database WHERE clause provides the atomic guarantee.
    // V2 METHOD: updateTutorialContentWithVersion (not updateSectionWithVersion)
    const updatedSection = await this.sectionRepository.updateTutorialContentWithVersion(
      input.sectionId,
      input.expectedVersion,
      {
        content: validatedDocument,
      }
    );

    // =================================================================
    // STEP 5: Handle version conflict
    // =================================================================
    // If updateTutorialContentWithVersion returns null, it means:
    // - Zero rows were updated
    // - Version conflict occurred (TOCTOU race)
    // - Current database version ≠ expectedVersion
    //
    // This is EXPECTED behavior when concurrent modifications occur.
    // The suggestion was generated against an old document version.
    // DO NOT retry automatically - let the client refresh and try again.
    if (!updatedSection) {
      // We don't know the actual current version without re-reading,
      // but we know it's not expectedVersion
      throw new VersionConflictError(input.expectedVersion, -1);
    }

    // =================================================================
    // STEP 6: Return result
    // =================================================================
    return {
      section: updatedSection,
      previousVersion: input.expectedVersion,
      newVersion: updatedSection.version,
      appliedSuggestionId: suggestion.id,
      appliedSuggestionType: suggestion.blockType,
    };
  }

  /**
   * Check if a section exists and get its current version
   * 
   * Useful for clients to verify section state before attempting application.
   * 
   * @param sectionId - Section ID to check
   * @returns Section info or null if not found
   */
  async getSectionVersion(
    sectionId: string
  ): Promise<{ version: number } | null> {
    const section = await this.sectionRepository.getTutorialById(sectionId);

    if (!section) {
      return null;
    }

    // V2 MIGRATION: Removed sectionType (legacy Tutorial Page column)
    return {
      version: section.version,
    };
  }
}

/**
 * Default service instance
 */
export const suggestionApplicationService = new SuggestionApplicationService();
