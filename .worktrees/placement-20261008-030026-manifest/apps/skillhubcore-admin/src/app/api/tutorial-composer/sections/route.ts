/**
 * Tutorial Composer API - Sections (V2)
 * V2 API using (subtopicId, brandId) identity
 *
 * POST   /api/tutorial-composer/sections      - Create tutorial
 * GET    /api/tutorial-composer/sections      - List tutorials
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  CreateTutorialRequestSchema,
  ListTutorialsQuerySchema,
  TutorialResponseSchema,
  ListTutorialsResponseSchema,
  type ApiErrorCode,
  type ValidationErrorDetail,
} from '@quiz/types';
import { tutorialComposerService, type TutorialComposerServiceContext } from '@quiz/db-tutorial';
import {
  TutorialDocumentValidationError,
  SectionAlreadyExistsError,
} from '@quiz/types';
import {
  authenticateRequest,
  createAuthErrorResponse,
  requireSubtopicAccess,
  requireBrandAccess,
} from '@/lib/auth-helpers';
import { invalidateTutorialDeliveryCache } from '@/lib/cache-invalidation';

// Force dynamic rendering (no static optimization)
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

  if (error instanceof SectionAlreadyExistsError) {
    return errorResponse('SECTION_ALREADY_EXISTS', error.message, 409);
  }

  // Generic error
  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

/**
 * Helper: Get authenticated context
 * @deprecated - Remove after migration complete
 * This function is no longer needed. Use authenticateRequest() instead.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getAuthenticatedContext(_request: NextRequest): TutorialComposerServiceContext {
  // This placeholder is replaced by real authentication above
  throw new Error('getAuthenticatedContext() is deprecated. Use authenticateRequest() instead.');
}

/**
 * POST /api/tutorial-composer/sections
 * Create new tutorial (V2)
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate request
    const authResult = await authenticateRequest(request);
    if ('type' in authResult) {
      return createAuthErrorResponse(authResult);
    }
    const { user } = authResult;

    // Step 2: Parse request body
    const body = await request.json();

    // Step 3: Validate request against schema
    const parseResult = CreateTutorialRequestSchema.safeParse(body);
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

    const requestData = parseResult.data;

    // Step 4: Authorize subtopic access
    const subtopicAuthError = requireSubtopicAccess(user, requestData.subtopicId);
    if (subtopicAuthError) {
      return createAuthErrorResponse(subtopicAuthError);
    }

    // Step 5: Authorize brand access (use default 'shared' if not specified)
    const brandId = requestData.brandId ?? 'shared';
    const brandAuthError = requireBrandAccess(user, brandId);
    if (brandAuthError) {
      return createAuthErrorResponse(brandAuthError);
    }

    // Step 6: Create authenticated context
    const context: TutorialComposerServiceContext = {
      userId: user.userId,
    };

    // Step 7: Create tutorial via V2 service
    const tutorial = await tutorialComposerService.createTutorial(
      requestData,
      context
    );

    // Step 8: Invalidate cache (async, don't block response)
    // Cache invalidation will automatically fetch subtopic slug from database
    invalidateTutorialDeliveryCache(requestData.subtopicId).catch((error) => {
      console.error('[Tutorial Composer] Cache invalidation failed', {
        subtopicId: requestData.subtopicId,
        error,
      });
    });

    // Step 9: Format Phase 1 response
    const response = TutorialResponseSchema.parse({
      id: tutorial.id,
      subtopicId: tutorial.subtopicId,
      navigationNodeId: tutorial.navigationNodeId, // Phase 1: Include page identity
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

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    console.error('[Tutorial Composer API] POST /api/tutorial-composer/sections - Error:', {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    
    return handleServiceError(error);
  }
}

/**
 * GET /api/tutorial-composer/sections
 * List tutorials with filters (V2)
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate request (admin API requires authentication)
    const authResult = await authenticateRequest(request);
    if ('type' in authResult) {
      return createAuthErrorResponse(authResult);
    }

    // Step 2: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      subtopicId: searchParams.get('subtopicId') || undefined,
      navigationNodeId: searchParams.get('navigationNodeId') || undefined, // Phase 1: Added
      brandId: searchParams.get('brandId') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
    };

    // Step 3: Validate query parameters
    const parseResult = ListTutorialsQuerySchema.safeParse(queryParams);
    if (!parseResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        parseResult.error.errors.map((err) => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          path: err.path.join('.'),
        }))
      );
    }

    const filters = parseResult.data;

    // Step 4: Query tutorials via V2 service
    const result = await tutorialComposerService.queryTutorials(
      {
        subtopicId: filters.subtopicId,
        navigationNodeId: filters.navigationNodeId, // Phase 1: Added
        brandId: filters.brandId,
        status: filters.status,
      },
      filters.limit,
      filters.cursor
    );

    // Step 5: Format Phase 1 response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.tutorials.map((tutorial: any) => ({
      id: tutorial.id,
      subtopicId: tutorial.subtopicId,
      navigationNodeId: tutorial.navigationNodeId, // Phase 1: Include page identity
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
    }));

    const response = ListTutorialsResponseSchema.parse({
      data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error);
  }
}
