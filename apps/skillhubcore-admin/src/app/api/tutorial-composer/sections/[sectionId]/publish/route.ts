/**
 * Tutorial Composer API - Publish Tutorial (V2)
 * V2 API using (subtopicId, brandId) identity
 * 
 * POST /api/tutorial-composer/sections/:sectionId/publish - Publish tutorial
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  PublishTutorialRequestSchema,
  TutorialResponseSchema,
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getAuthenticatedContext(_request: NextRequest): TutorialComposerServiceContext {
  throw new Error('getAuthenticatedContext() is deprecated. Use authenticateRequest() instead.');
}

/**
 * POST /api/tutorial-composer/sections/:sectionId/publish
 * Publish tutorial (V2)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;

    // Step 1: Authenticate request
    const authResult = await authenticateRequest(request);
    if ('type' in authResult) {
      return createAuthErrorResponse(authResult);
    }
    const { user } = authResult;

    // Step 2: Fetch existing tutorial to check permissions
    const existingTutorial = await tutorialComposerService.getTutorial(sectionId);

    // Step 3: Authorize subtopic access
    const subtopicAuthError = requireSubtopicAccess(user, existingTutorial.subtopicId);
    if (subtopicAuthError) {
      return createAuthErrorResponse(subtopicAuthError);
    }

    // Step 4: Authorize brand access
    const brandAuthError = requireBrandAccess(user, existingTutorial.brandId);
    if (brandAuthError) {
      return createAuthErrorResponse(brandAuthError);
    }

    // Step 5: Parse and validate request body (empty body expected)
    const body = await request.json().catch(() => ({}));
    const parseResult = PublishTutorialRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid request data', 400);
    }

    // Step 6: Create authenticated context
    const context: TutorialComposerServiceContext = {
      userId: user.userId,
    };

    // Step 7: Publish tutorial via V2 service
    const tutorial = await tutorialComposerService.publishTutorial(
      sectionId,
      context
    );

    // Step 8: Invalidate cache (CRITICAL for publish - learners must see new content)
    invalidateTutorialDeliveryCache(existingTutorial.subtopicId).catch((error) => {
      console.error('[Tutorial Composer] CRITICAL: Cache invalidation failed after publish', {
        subtopicId: existingTutorial.subtopicId,
        sectionId,
        error,
      });
    });

    // Step 9: Format V2 response
    const response = TutorialResponseSchema.parse({
      id: tutorial.id,
      subtopicId: tutorial.subtopicId,
      navigationNodeId: tutorial.navigationNodeId,
      brandId: tutorial.brandId,
      orderIndex: tutorial.orderIndex,
      content: tutorial.content,
      version: tutorial.version,
      language: tutorial.language,
      status: tutorial.status,
      generatedByAi: tutorial.generatedByAi,
      aiModelUsed: tutorial.aiModelUsed,
      generationJobId: tutorial.generationJobId,
      qualityScore: tutorial.qualityScore,
      hallucinationScore: tutorial.hallucinationScore,
      regenerationCount: tutorial.regenerationCount,
      approvedBy: tutorial.approvedBy,
      approvedAt: tutorial.approvedAt?.toISOString() || null,
      rejectionReason: tutorial.rejectionReason,
      promptTemplateId: tutorial.promptTemplateId,
      educationalArchitectureId: tutorial.educationalArchitectureId,
      uiArchitectureId: tutorial.uiArchitectureId,
      brandVisibility: tutorial.brandVisibility,
      brandCustomizations: tutorial.brandCustomizations,
      createdAt: tutorial.createdAt.toISOString(),
      updatedAt: tutorial.updatedAt.toISOString(),
      publishedAt: tutorial.publishedAt?.toISOString() || null,
      deletedAt: tutorial.deletedAt?.toISOString() || null,
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleServiceError(error);
  }
}
