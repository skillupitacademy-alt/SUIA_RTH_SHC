/**
 * Tutorial Composer API - Sections
 * NEW Composer API routes (clean separation from legacy ContentManager)
 * 
 * POST   /api/tutorial-composer/sections      - Create section
 * GET    /api/tutorial-composer/sections      - List sections
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  CreateTutorialSectionRequestSchema,
  ListTutorialSectionsQuerySchema,
  TutorialSectionResponseSchema,
  ListTutorialSectionsResponseSchema,
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
function getAuthenticatedContext(request: NextRequest): TutorialComposerServiceContext {
  // This placeholder is replaced by real authentication above
  throw new Error('getAuthenticatedContext() is deprecated. Use authenticateRequest() instead.');
}

/**
 * POST /api/tutorial-composer/sections
 * Create new tutorial section
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

    // Step 3: Validate request schema
    const parseResult = CreateTutorialSectionRequestSchema.safeParse(body);
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

    // Step 7: Create section via service
    const section = await tutorialComposerService.createSection(
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

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    return handleServiceError(error);
  }
}

/**
 * GET /api/tutorial-composer/sections
 * List tutorial sections with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      subtopicId: searchParams.get('subtopicId') || undefined,
      sectionType: searchParams.get('sectionType') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      status: searchParams.get('status') || undefined,
      brandId: searchParams.get('brandId') || undefined,
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
    };

    // Step 2: Validate query parameters
    const parseResult = ListTutorialSectionsQuerySchema.safeParse(queryParams);
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

    // Step 4: Query sections
    const result = await tutorialComposerService.querySections(
      {
        subtopicId: filters.subtopicId,
        sectionType: filters.sectionType,
        difficulty: filters.difficulty,
        status: filters.status,
        brandId: filters.brandId,
      },
      filters.limit,
      filters.cursor
    );

    // Step 5: Format response
    const data = result.sections.map((section: any) => ({
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
    }));

    const response = ListTutorialSectionsResponseSchema.parse({
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
