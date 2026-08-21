/**
 * Suggestion Verification Service
 * 
 * PHASE B — PROMPT 08
 * 
 * PURPOSE:
 * Server-side verification that a client-provided suggestion reference
 * matches the current document state.
 * 
 * SECURITY ARCHITECTURE:
 * - Client provides: suggestionId, fingerprint, expectedVersion
 * - Server regenerates suggestions from CURRENT document
 * - Server verifies fingerprint matches
 * - Server returns SERVER-GENERATED suggestion
 * - Client CANNOT provide suggestedContent directly
 * 
 * WORKFLOW:
 * 1. Load current TutorialSection by ID
 * 2. Verify section version matches expectedVersion (early rejection)
 * 3. Regenerate suggestions from current TutorialDocument
 * 4. Locate requested suggestion by ID
 * 5. Generate server-side fingerprint
 * 6. Compare with client fingerprint
 * 7. Return verified SERVER-GENERATED suggestion
 * 
 * CRITICAL SECURITY RULE:
 * Never accept client-provided suggestedContent as authoritative.
 * The server MUST regenerate and verify.
 */

import type { BlockSuggestion } from '@quiz/types';
import type { TutorialSection } from '../schema/tutorial-sections';
import {
  VersionConflictError,
  SectionNotFoundError,
  SuggestionNotFoundError,
  SuggestionFingerprintMismatchError,
} from '@quiz/types';
import { TutorialSectionRepository } from '../repositories/tutorial-section.repository';
import { BlockSuggestionService } from './block-suggestion.service';
import { ContentAnalysisService } from './content-analysis.service';
import { fingerprintSuggestion } from './suggestion-fingerprint.service';

/**
 * Input for suggestion verification
 */
export interface VerifySuggestionInput {
  sectionId: string;
  suggestionId: string;
  suggestionFingerprint: string;
  expectedVersion: number;
}

/**
 * Verified suggestion result
 * Contains the server-generated suggestion and current section state
 */
export interface VerifiedSuggestion {
  suggestion: BlockSuggestion;
  section: TutorialSection;
  fingerprint: string;
}

/**
 * Suggestion Verification Service
 * 
 * Verifies that client suggestion references match the current document state.
 */
export class SuggestionVerificationService {
  private sectionRepository: TutorialSectionRepository;
  private suggestionService: BlockSuggestionService;
  private analysisService: ContentAnalysisService;

  constructor(
    sectionRepository?: TutorialSectionRepository,
    suggestionService?: BlockSuggestionService,
    analysisService?: ContentAnalysisService
  ) {
    this.sectionRepository = sectionRepository || new TutorialSectionRepository();
    this.suggestionService = suggestionService || new BlockSuggestionService();
    this.analysisService = analysisService || new ContentAnalysisService();
  }

  /**
   * Verify a suggestion reference against the current document
   * 
   * @param input - Verification input with suggestion reference
   * @returns Verified suggestion with server-generated content
   * @throws {SectionNotFoundError} Section does not exist
   * @throws {VersionConflictError} Version mismatch (early rejection)
   * @throws {SuggestionNotFoundError} Suggestion ID not found in regenerated set
   * @throws {SuggestionFingerprintMismatchError} Fingerprint mismatch
   * 
   * @example
   * ```ts
   * const verified = await service.verify({
   *   sectionId: 'section-123',
   *   suggestionId: 'suggestion-summary',
   *   suggestionFingerprint: 'a3f5e7...',
   *   expectedVersion: 5
   * });
   * 
   * // verified.suggestion contains SERVER-GENERATED content
   * // Client cannot tamper with suggestedContent
   * ```
   */
  async verify(input: VerifySuggestionInput): Promise<VerifiedSuggestion> {
    // Step 1: Load current tutorial (V2 method)
    const section = await this.sectionRepository.getTutorialById(input.sectionId);

    if (!section) {
      throw new SectionNotFoundError(input.sectionId);
    }

    // Step 2: Verify version (early rejection for clear error messages)
    // IMPORTANT: This is NOT the final concurrency check.
    // The final mutation MUST still use updateTutorialContentWithVersion()
    // to prevent TOCTOU races.
    if (section.version !== input.expectedVersion) {
      throw new VersionConflictError(input.expectedVersion, section.version);
    }

    // Step 3: Extract current TutorialDocument
    const document = section.content as any; // TutorialDocument stored in JSONB

    // Step 4: Regenerate content analysis
    // REQUIRED for Summary suggestions per Prompt 07B
    const analysis = this.analysisService.analyzeDocument(document);

    // Step 5: Regenerate suggestions from CURRENT document
    // This ensures we're working with server-authoritative data
    // V2 MIGRATION: Removed sectionType (legacy Tutorial Page column)
    const suggestionResult = this.suggestionService.generateSuggestions(
      document,
      analysis,
      {
        subtopicId: section.subtopicId,
        brandId: section.brandId,
      }
    );

    // Step 6: Locate requested suggestion by ID
    const suggestion = suggestionResult.blocks.find(
      (s) => s.id === input.suggestionId
    );

    if (!suggestion) {
      throw new SuggestionNotFoundError(input.suggestionId);
    }

    // Step 7: Generate server-side canonical fingerprint
    const serverFingerprint = fingerprintSuggestion(suggestion);

    // Step 8: Compare fingerprints
    // Exact match required - no tolerance for differences
    if (serverFingerprint !== input.suggestionFingerprint) {
      throw new SuggestionFingerprintMismatchError(input.suggestionId);
    }

    // Step 9: Return verified SERVER-GENERATED suggestion
    // The suggestion object comes from server regeneration,
    // NOT from client input
    return {
      suggestion,
      section,
      fingerprint: serverFingerprint,
    };
  }

  /**
   * Batch verify multiple suggestions
   * 
   * Optimized for scenarios where multiple suggestions need verification
   * from the same document (e.g., accepting multiple suggestions at once).
   * 
   * @param sectionId - Section ID
   * @param expectedVersion - Expected section version
   * @param suggestionRefs - Array of suggestion references to verify
   * @returns Array of verified suggestions
   * @throws Same errors as verify() if any suggestion fails
   */
  async verifyBatch(
    sectionId: string,
    expectedVersion: number,
    suggestionRefs: Array<{ suggestionId: string; suggestionFingerprint: string }>
  ): Promise<VerifiedSuggestion[]> {
    // Load tutorial once (V2 method)
    const section = await this.sectionRepository.getTutorialById(sectionId);

    if (!section) {
      throw new SectionNotFoundError(sectionId);
    }

    if (section.version !== expectedVersion) {
      throw new VersionConflictError(expectedVersion, section.version);
    }

    // Regenerate suggestions once
    const document = section.content as any;
    const analysis = this.analysisService.analyzeDocument(document);
    // V2 MIGRATION: Removed sectionType (legacy Tutorial Page column)
    const suggestionResult = this.suggestionService.generateSuggestions(
      document,
      analysis,
      {
        subtopicId: section.subtopicId,
        brandId: section.brandId,
      }
    );

    // Verify each suggestion
    const verified: VerifiedSuggestion[] = [];

    for (const ref of suggestionRefs) {
      const suggestion = suggestionResult.blocks.find((s) => s.id === ref.suggestionId);

      if (!suggestion) {
        throw new SuggestionNotFoundError(ref.suggestionId);
      }

      const serverFingerprint = fingerprintSuggestion(suggestion);

      if (serverFingerprint !== ref.suggestionFingerprint) {
        throw new SuggestionFingerprintMismatchError(ref.suggestionId);
      }

      verified.push({
        suggestion,
        section,
        fingerprint: serverFingerprint,
      });
    }

    return verified;
  }
}
