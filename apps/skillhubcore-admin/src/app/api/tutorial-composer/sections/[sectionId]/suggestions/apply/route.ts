/**
 * Tutorial Composer API - Apply Suggestion
 * 
 * PROMPT 08 WAVE 1: Phase E+F
 * 
 * POST /api/tutorial-composer/sections/:sectionId/suggestions/apply
 * 
 * Applies a server-regenerated block suggestion to a tutorial section.
 * 
 * SECURITY MODEL:
 * - Client provides ONLY: suggestionId, suggestionFingerprint, expectedVersion
 * - sectionId comes from URL parameter
 * - Server regenerates suggestion content (Phase B verification service)
 * - Server transforms to canonical blocks (Phase C transformation service)
 * - Server validates and persists (Phase D application service + Phase A repository)
 * 
 * CLIENT NEVER PROVIDES:
 * - suggestedContent
 * - TutorialBlock
 * - TutorialDocument
 * - transformed content
 * 
 * FROZEN BOUNDARIES:
 * - Phase A (repository)
 * - Phase B (verification)
 * - Phase C (transformation)
 * - Phase D (application orchestration)
 * - BLOCK_REGISTRY (17 types)
 * 
 * WAVE 1 SCOPE:
 * - Authentication/Authorization
 * - Request validation
 * - Service orchestration
 * - Response formatting
 * - Error mapping
 * 
 * NOT IN WAVE 1:
 * - Cache invalidation (Wave 2)
 * - Idempotency tables (Wave 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ApplySuggestionRequestSchema,
  ApplySuggestionResponseSchema,
  type ApplySuggestionErrorCode,
  type VersionConflictDetail,
  TutorialSectionResponseSchema,
} from '@quiz/types';
import {
  SectionNotFoundError,
  SuggestionNotFoundError,
  SuggestionFingerprintMismatchError,
  InvalidSuggestionError,
  InvalidTransformationError,
  VersionConflictError,
  TutorialDocumentValidationError,
} from '@quiz/types';
import {
  suggestionApplicationService,
  tutorialComposerService,
} from '@quiz/db-tutorial';
import {
  authenticateRequest,
  createAuthErrorResponse,
  requireTutorialEditPermission,
  requireSubtopicAccess,
  requireBrandAccess,
} from '@/lib/auth-helpers';
import { invalidateTutorialDeliveryCache } from '@/lib/cache-invalidation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Helper: Create error response
 */
function errorResponse(
  code: ApplySuggestionErrorCode,
  message: string,
  status: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

/**
 * Helper: Map domain errors to HTTP responses
 * 
 * FROZEN ERROR TYPES (from frozen phases):
 * - SectionNotFoundError (Phase A)
 * - SuggestionNotFoundError (Phase B)
 * - SuggestionFingerprintMismatchError (Phase B)
 * - InvalidSuggestionError (Phase B)
 * - InvalidTransformationError (Phase C)
 * - VersionConflictError (Phase A)
 * - TutorialDocumentValidationError (Phase D)
 */
function handleServiceError(error: unknown) {
  console.error('[Apply Suggestion] Service error:', error);

  // Section errors (Phase A)
  if (error instanceof SectionNotFoundError) {
    return errorResponse(
      'SECTION_NOT_FOUND',
      error.message,
      404
    );
  }

  // Suggestion errors (Phase B)
  if (error instanceof SuggestionNotFoundError) {
    return errorResponse(
      'SUGGESTION_NOT_FOUND',
      error.message,
      400
    );
  }

  if (error instanceof SuggestionFingerprintMismatchError) {
    return errorResponse(
      'SUGGESTION_INVALID',
      error.message,
      400
    );
  }

  if (error instanceof InvalidSuggestionError) {
    return errorResponse(
      'SUGGESTION_INVALID',
      error.message,
      400
    );
  }

  // Transformation errors (Phase C)
  if (error instanceof InvalidTransformationError) {
    return errorResponse(
      'TRANSFORMATION_FAILED',
      error.message,
      400
    );
  }

  // Validation errors (Phase D boundary)
  if (error instanceof TutorialDocumentValidationError) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Tutorial document validation failed',
      422,
      error.validationErrors
    );
  }

  // Concurrency errors (Phase A)
  if (error instanceof VersionConflictError) {
    // Extract version numbers from error message
    // Format: "Version conflict: expected X, got Y"
    const match = error.message.match(/expected (\d+), got (\d+)/);
    const expectedVersion = match ? parseInt(match[1], 10) : -1;
    const currentVersion = match ? parseInt(match[2], 10) : -1;

    const details: VersionConflictDetail = {
      expectedVersion,
      currentVersion,
    };

    return errorResponse(
      'VERSION_CONFLICT',
      error.message,
      409,
      details
    );
  }

  // Generic error
  return errorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred while applying the suggestion',
    500
  );
}

/**
 * POST /api/tutorial-composer/sections/:sectionId/suggestions/apply
 * 
 * Apply a server-regenerated block suggestion to a tutorial section.
 * 
 * REQUEST BODY:
 * {
 *   suggestionId: string,
 *   suggestionFingerprint: string (SHA-256 hex),
 *   expectedVersion: number (positive integer)
 * }
 * 
 * RESPONSE (200):
 * {
 *   data: {
 *     section: TutorialSectionResponse,
 *     previousVersion: number,
 *     newVersion: number,
 *     appliedSuggestionId: string,
 *     appliedSuggestionType: string
 *   }
 * }
 * 
 * ERRORS:
 * - 401: Authentication failure
 * - 403: Authorization failure
 * - 400: Validation error, suggestion not found, fingerprint mismatch, invalid suggestion
 * - 404: Section not found
 * - 409: Version conflict
 * - 422: Document validation failed
 * - 500: Internal error
 * 
 * RETRY SEMANTICS (Phase H):
 * 
 * This endpoint uses OPTIMISTIC CONCURRENCY for mutation safety, NOT traditional
 * HTTP idempotency. This has specific implications for retry behavior:
 * 
 * 1. SUCCESSFUL RETRY DETECTION:
 *    Request 1: expectedVersion=5 → SUCCESS → version=6 → 200
 *    Request 2 (retry): expectedVersion=5 → WHERE version=5 → 0 rows → 409 VERSION_CONFLICT
 *    
 *    The retry gets 409, not a cached 200. The client must detect that the
 *    version conflict occurred because the mutation already succeeded.
 * 
 * 2. CONCURRENT REQUEST PROTECTION:
 *    Process A: expectedVersion=5 → acquires row lock → version=6 → SUCCESS
 *    Process B: expectedVersion=5 → blocks on row lock → WHERE version=5 → 0 rows → 409
 *    
 *    Exactly ONE request succeeds. Others get 409 VERSION_CONFLICT.
 * 
 * 3. CLIENT RESPONSIBILITY:
 *    - Client MUST check 409 response details.currentVersion
 *    - If currentVersion > expectedVersion, mutation may have succeeded
 *    - Client should GET the section to verify the actual state
 *    - Client should NOT blindly retry 409 responses
 * 
 * 4. MVP CONSTRAINTS:
 *    - ❌ NO idempotency-key table
 *    - ❌ NO request deduplication
 *    - ❌ NO cached success responses for retries
 *    - ✅ Database-level mutation safety via optimistic concurrency
 *    - ✅ Concurrent requests protected by row-level locking
 * 
 * This design provides MUTATION IDEMPOTENCY (same mutation applied once)
 * but NOT HTTP IDEMPOTENCY (same response for repeated requests).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;

    // ========================================
    // STEP 1: Authenticate Request
    // ========================================
    const authResult = await authenticateRequest(request);
    if ('type' in authResult) {
      return createAuthErrorResponse(authResult);
    }
    const { user } = authResult;

    // ========================================
    // STEP 2: Fetch Section (for authorization)
    // ========================================
    // We need to fetch the section BEFORE applying the suggestion
    // to perform authorization checks on subtopicId and brandId.
    const existingSection = await tutorialComposerService.getSection(sectionId);

    // ========================================
    // STEP 3: Authorize Tutorial Edit Permission
    // ========================================
    const editPermissionError = requireTutorialEditPermission(user);
    if (editPermissionError) {
      return createAuthErrorResponse(editPermissionError);
    }

    // ========================================
    // STEP 4: Authorize Subtopic Access
    // ========================================
    const subtopicAuthError = requireSubtopicAccess(user, existingSection.subtopicId);
    if (subtopicAuthError) {
      return createAuthErrorResponse(subtopicAuthError);
    }

    // ========================================
    // STEP 5: Authorize Brand Access
    // ========================================
    const brandAuthError = requireBrandAccess(user, existingSection.brandId);
    if (brandAuthError) {
      return createAuthErrorResponse(brandAuthError);
    }

    // ========================================
    // STEP 6: Parse Request Body
    // ========================================
    const body = await request.json();

    // ========================================
    // STEP 7: Validate Request Schema (strict mode)
    // ========================================
    const parseResult = ApplySuggestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request data',
        400,
        parseResult.error.errors.map((err) => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          path: err.path.join('.'),
        }))
      );
    }

    const { suggestionId, suggestionFingerprint, expectedVersion } = parseResult.data;

    // ========================================
    // STEP 8: Apply Suggestion (Phase D)
    // ========================================
    // Phase D orchestrates:
    // - Phase B: Regenerate and verify suggestion
    // - Phase C: Transform suggestion to canonical blocks
    // - Phase D: Validate TutorialDocument
    // - Phase A: Persist with optimistic concurrency
    const result = await suggestionApplicationService.applySuggestion({
      sectionId,
      suggestionId,
      suggestionFingerprint,
      expectedVersion,
    });

    // ========================================
    // STEP 9: Invalidate Cache (Phase G)
    // ========================================
    // CRITICAL ORDERING:
    // Cache invalidation ONLY happens AFTER successful database commit.
    // Uses the persisted result's subtopicId to ensure cache matches reality.
    //
    // Fire-and-forget: Cache failure does NOT fail the response.
    // The mutation succeeded at the database level.
    void invalidateTutorialDeliveryCache(result.section.subtopicId).catch((error) => {
      console.error('[Apply Suggestion] Cache invalidation failed', {
        sectionId: result.section.id,
        subtopicId: result.section.subtopicId,
        error,
      });
    });

    // ========================================
    // STEP 10: Format Response
    // ========================================
    const response = ApplySuggestionResponseSchema.parse({
      section: TutorialSectionResponseSchema.parse({
        id: result.section.id,
        subtopicId: result.section.subtopicId,
        sectionType: result.section.sectionType,
        difficulty: result.section.difficulty,
        orderIndex: result.section.orderIndex,
        content: result.section.content,
        version: result.section.version,
        language: result.section.language,
        status: result.section.status,
        brandId: result.section.brandId,
        generatedByAi: result.section.generatedByAi,
        aiModelUsed: result.section.aiModelUsed,
        qualityScore: result.section.qualityScore,
        createdAt: result.section.createdAt.toISOString(),
        updatedAt: result.section.updatedAt.toISOString(),
        publishedAt: result.section.publishedAt?.toISOString() || null,
      }),
      previousVersion: result.previousVersion,
      newVersion: result.newVersion,
      appliedSuggestionId: result.appliedSuggestionId,
      appliedSuggestionType: result.appliedSuggestionType,
    });

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    return handleServiceError(error);
  }
}
