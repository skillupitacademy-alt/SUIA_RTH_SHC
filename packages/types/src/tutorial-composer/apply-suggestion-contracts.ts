/**
 * Tutorial Composer - Apply Suggestion API Contracts
 * 
 * PROMPT 08 WAVE 1: Phase E+F
 * 
 * Request/Response contracts for suggestion application endpoint.
 * 
 * SECURITY MODEL:
 * - Client provides ONLY: suggestionId, suggestionFingerprint, expectedVersion
 * - sectionId comes from URL parameter
 * - Server regenerates suggestion content (Phase B)
 * - Server transforms to canonical blocks (Phase C)
 * - Server validates and persists (Phase D + Phase A)
 * 
 * CLIENT NEVER PROVIDES:
 * - suggestedContent
 * - TutorialBlock
 * - TutorialDocument
 * - transformed content
 */

import { z } from 'zod';
import { TutorialSectionResponseSchema } from './contracts';

// ============================================================
// APPLY SUGGESTION REQUEST
// ============================================================

/**
 * Apply Suggestion Request Schema
 * 
 * Client provides only verification and concurrency data.
 * All content is server-generated through Phase B → C → D.
 * 
 * STRICT MODE: Rejects unknown properties to prevent content injection.
 */
export const ApplySuggestionRequestSchema = z
  .object({
    /**
     * Suggestion ID from server-generated BlockSuggestionResult
     * Must match a suggestion in the server-regenerated suggestion set
     */
    suggestionId: z
      .string()
      .min(1, 'suggestionId is required'),

    /**
     * Suggestion fingerprint for verification
     * Must be a valid SHA-256 hash (64 hexadecimal characters)
     * 
     * The server regenerates suggestions and compares fingerprints.
     * If fingerprints don't match, the suggestion has changed and
     * the client must refresh.
     */
    suggestionFingerprint: z
      .string()
      .regex(
        /^[a-fA-F0-9]{64}$/,
        'suggestionFingerprint must be a 64-character hexadecimal SHA-256 hash'
      ),

    /**
     * Expected section version for optimistic concurrency
     * Must be a positive integer
     * 
     * The database UPDATE will only succeed if:
     * WHERE version = expectedVersion
     * 
     * If another process modified the section, version conflict occurs.
     */
    expectedVersion: z
      .number()
      .int('expectedVersion must be an integer')
      .positive('expectedVersion must be positive'),
  })
  .strict(); // Rejects unknown properties (security: no content injection)

export type ApplySuggestionRequest = z.infer<typeof ApplySuggestionRequestSchema>;

// ============================================================
// APPLY SUGGESTION RESPONSE
// ============================================================

/**
 * Apply Suggestion Response Schema
 * 
 * Returned on successful suggestion application.
 * Contains the updated section and version transition metadata.
 */
export const ApplySuggestionResponseSchema = z
  .object({
    /**
     * Updated section with new content and incremented version
     */
    section: TutorialSectionResponseSchema,

    /**
     * Version before the application
     */
    previousVersion: z
      .number()
      .int()
      .positive(),

    /**
     * New version after the application
     * Always: newVersion = previousVersion + 1
     */
    newVersion: z
      .number()
      .int()
      .positive(),

    /**
     * ID of the suggestion that was applied
     */
    appliedSuggestionId: z.string(),

    /**
     * Type of the suggestion that was applied
     * e.g., "summary", "callout", "two-column"
     */
    appliedSuggestionType: z.string(),
  })
  .strict();

export type ApplySuggestionResponse = z.infer<typeof ApplySuggestionResponseSchema>;

// ============================================================
// ERROR CODES
// ============================================================

/**
 * Apply Suggestion Error Codes
 * 
 * Additional error codes specific to suggestion application.
 * These extend the base ApiErrorCode from contracts.ts
 */
export const ApplySuggestionErrorCode = z.enum([
  // Base error codes (from contracts.ts)
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  
  // Section errors
  'SECTION_NOT_FOUND',
  
  // Suggestion errors
  'SUGGESTION_NOT_FOUND',
  'SUGGESTION_INVALID',
  
  // Transformation errors
  'TRANSFORMATION_FAILED',
  
  // Concurrency errors
  'VERSION_CONFLICT',
  
  // Generic errors
  'INTERNAL_ERROR',
]);

export type ApplySuggestionErrorCode = z.infer<typeof ApplySuggestionErrorCode>;

// ============================================================
// VERSION CONFLICT ERROR DETAIL
// ============================================================

/**
 * Version Conflict Error Detail
 * 
 * Provides additional context when a version conflict occurs.
 * This allows clients to display helpful messages like:
 * "Expected version 5, but current version is 6"
 */
export const VersionConflictDetailSchema = z
  .object({
    /**
     * Version the client expected (from request)
     */
    expectedVersion: z.number().int().positive(),
    
    /**
     * Actual current version in the database
     * May be -1 if version is unknown (e.g., TOCTOU race detected)
     */
    currentVersion: z.number().int(),
  })
  .strict();

export type VersionConflictDetail = z.infer<typeof VersionConflictDetailSchema>;

/**
 * Apply Suggestion Error Response
 * 
 * Standard error response shape following existing project convention.
 */
export const ApplySuggestionErrorResponseSchema = z
  .object({
    error: z.object({
      code: ApplySuggestionErrorCode,
      message: z.string(),
      details: z.any().optional(), // Can be ValidationErrorDetail[] or VersionConflictDetail
    }),
  })
  .strict();

export type ApplySuggestionErrorResponse = z.infer<typeof ApplySuggestionErrorResponseSchema>;
