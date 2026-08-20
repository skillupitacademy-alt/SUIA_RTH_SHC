/**
 * Tutorial Composer API - Individual Section
 * NEW Composer API routes (clean separation from legacy ContentManager)
 * 
 * GET    /api/tutorial-composer/sections/:sectionId      - Get section
 * PATCH  /api/tutorial-composer/sections/:sectionId      - Update section
 * DELETE /api/tutorial-composer/sections/:sectionId      - Archive section
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  UpdateTutorialSectionRequestSchema,
  TutorialSectionResponseSchema,
  type ApiErrorCode,
  type ValidationErrorDetail,
} from '@quiz/types';
import { tutorialComposerService, type TutorialComposerServiceContext } from '@quiz/db-tutorial';
import {
  TutorialDocumentValidationError,
  SectionNotFoundError,
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
 * GET /api/tutorial-composer/sections/:sectionId
 * Get single tutorial section
 */
export async function GET(
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
    // Note: GET does not require authorization checks beyond authentication

    // Step 2: Fetch section
    const section = await tutorialComposerService.getSection(sectionId);

    // Step 3: Format response
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

/**
 * PATCH /api/tutorial-composer/sections/:sectionId
 * Update tutorial section
 */
export async function PATCH(
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

    // Step 5: Parse request body
    const body = await request.json();

    // Step 6: Validate request schema
    const parseResult = UpdateTutorialSectionRequestSchema.safeParse(body);
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

    // Step 7: Create authenticated context
    const context: TutorialComposerServiceContext = {
      userId: user.userId,
    };

    // Step 8: Update section via service
    const section = await tutorialComposerService.updateSection(
      sectionId,
      parseResult.data,
      context
    );

    // Step 9: Invalidate cache (async, don't block response)
    invalidateTutorialDeliveryCache(existingSection.subtopicId).catch((error) => {
      console.error('[Tutorial Composer] Cache invalidation failed', {
        subtopicId: existingSection.subtopicId,
        error,
      });
    });

    // Step 10: Format response
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

/**
 * DELETE /api/tutorial-composer/sections/:sectionId
 * Archive tutorial section (soft delete)
 */
export async function DELETE(
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

    // Step 5: Create authenticated context
    const context: TutorialComposerServiceContext = {
      userId: user.userId,
    };

    // Step 6: Archive section
    await tutorialComposerService.archiveSection(sectionId, context);

    // Step 7: Invalidate cache (async, don't block response)
    invalidateTutorialDeliveryCache(existingSection.subtopicId).catch((error) => {
      console.error('[Tutorial Composer] Cache invalidation failed', {
        subtopicId: existingSection.subtopicId,
        error,
      });
    });

    return NextResponse.json(
      { message: 'Section archived successfully' },
      { status: 200 }
    );
  } catch (error) {
    return handleServiceError(error);
  }
}
