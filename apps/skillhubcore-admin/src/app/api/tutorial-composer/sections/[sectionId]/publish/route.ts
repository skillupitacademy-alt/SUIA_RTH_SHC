/**
 * Tutorial Composer API - Publish Section
 * NEW Composer API routes (clean separation from legacy ContentManager)
 * 
 * POST /api/tutorial-composer/sections/:sectionId/publish - Publish section
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  PublishTutorialSectionRequestSchema,
  TutorialSectionResponseSchema,
  type ApiErrorCode,
  type ValidationErrorDetail,
} from '@quiz/types';
import { tutorialComposerService, type TutorialComposerServiceContext } from '@quiz/db-tutorial';
import {
  TutorialDocumentValidationError,
  SectionNotFoundError,
  InvalidStatusTransitionError,
} from '@quiz/types';
import {
  authenticateRequest,
  createAuthErrorResponse,
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
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: ValidationErrorDetail[]
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
 * Helper: Map service errors to HTTP responses
 */
function handleServiceError(error: unknown) {
  console.error('Tutorial Composer API Error:', error);

  if (error instanceof TutorialDocumentValidationError) {
    return errorResponse(
      'TUTORIAL_DOCUMENT_INVALID',
      'Tutorial document validation failed',
      422,
      error.validationErrors
    );
  }

  if (error instanceof SectionNotFoundError) {
    return errorResponse('SECTION_NOT_FOUND', error.message, 404);
  }

  if (error instanceof InvalidStatusTransitionError) {
    return errorResponse('INVALID_STATUS_TRANSITION', error.message, 409);
  }

  // Generic error
  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

/**
 * Helper: Get authenticated context
 * @deprecated - Remove after migration complete
 */
function getAuthenticatedContext(request: NextRequest): TutorialComposerServiceContext {
  throw new Error('getAuthenticatedContext() is deprecated. Use authenticateRequest() instead.');
}

/**
 * POST /api/tutorial-composer/sections/:sectionId/publish
 * Publish tutorial section
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> | { sectionId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { sectionId } = resolvedParams;

    // Step 1: Authenticate request
    const authResult = await authenticateRequest(request);
    if ('type' in authResult) {
      return createAuthErrorResponse(authResult);
    }
    const { user } = authResult;

    // Step 2: Fetch existing section to check permissions
    const existingSection = await tutorialComposerService.getSection(sectionId);

    // Step 3: Authorize subtopic access
    const subtopicAuthError = requireSubtopicAccess(user, existingSection.subtopicId);
    if (subtopicAuthError) {
      return createAuthErrorResponse(subtopicAuthError);
    }

    // Step 4: Authorize brand access
    const brandAuthError = requireBrandAccess(user, existingSection.brandId);
    if (brandAuthError) {
      return createAuthErrorResponse(brandAuthError);
    }

    // Step 5: Parse and validate request body (empty body expected)
    const body = await request.json().catch(() => ({}));
    const parseResult = PublishTutorialSectionRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid request data', 400);
    }

    // Step 6: Create authenticated context
    const context: TutorialComposerServiceContext = {
      userId: user.userId,
    };

    // Step 7: Publish section via service
    const section = await tutorialComposerService.publishSection(
      sectionId,
      context
    );

    // Step 8: Invalidate cache (CRITICAL for publish - learners must see new content)
    invalidateTutorialDeliveryCache(existingSection.subtopicId).catch((error) => {
      console.error('[Tutorial Composer] CRITICAL: Cache invalidation failed after publish', {
        subtopicId: existingSection.subtopicId,
        sectionId,
        error,
      });
    });

    // Step 9: Format response
    const response = TutorialSectionResponseSchema.parse({
      id: section.id,
      subtopicId: section.subtopicId,
      sectionType: section.sectionType,
      difficulty: section.difficulty,
      orderIndex: section.orderIndex,
      content: section.content,
      version: section.version,
      language: section.language,
      status: section.status,
      brandId: section.brandId,
      generatedByAi: section.generatedByAi,
      aiModelUsed: section.aiModelUsed,
      qualityScore: section.qualityScore,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
      publishedAt: section.publishedAt?.toISOString() || null,
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleServiceError(error);
  }
}
