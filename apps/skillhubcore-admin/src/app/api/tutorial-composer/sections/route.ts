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
  const diagnosticId = `POST-${Date.now()}`;
  
  try {
    console.log(`[${diagnosticId}] POST /api/tutorial-composer/sections - Starting`);
    
    // Step 1: Authenticate request
    const authResult = await authenticateRequest(request);
    if ('type' in authResult) {
      console.log(`[${diagnosticId}] Authentication failed:`, authResult);
      return createAuthErrorResponse(authResult);
    }
    const { user } = authResult;
    
    console.log(`[${diagnosticId}] Authenticated:`, {
      userId: user.userId,
      email: user.email,
      roles: user.roles,
      isAdmin: user.isAdmin,
    });

    // Step 2: Parse request body
    const body = await request.json();
    
    console.log(`[${diagnosticId}] Request body summary:`, {
      subtopicId: body.subtopicId,
      brandId: body.brandId,
      orderIndex: body.orderIndex,
      contentSchemaVersion: body.content?.schemaVersion,
      blocksCount: body.content?.blocks?.length,
      blockTypes: body.content?.blocks?.map((b: any) => b.type),
      blockIds: body.content?.blocks?.map((b: any) => b.id),
      blockVersions: body.content?.blocks?.map((b: any) => b.version),
    });

    // Step 3: Validate request schema
    const parseResult = CreateTutorialRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.log(`[${diagnosticId}] Schema validation failed:`, parseResult.error.errors);
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
    
    console.log(`[${diagnosticId}] Schema validation passed`);

    // Step 4: Authorize subtopic access
    const subtopicAuthError = requireSubtopicAccess(user, requestData.subtopicId);
    if (subtopicAuthError) {
      console.log(`[${diagnosticId}] Subtopic access denied:`, subtopicAuthError);
      return createAuthErrorResponse(subtopicAuthError);
    }
    
    console.log(`[${diagnosticId}] Subtopic access authorized: ${requestData.subtopicId}`);

    // Step 5: Authorize brand access (use default 'shared' if not specified)
    const brandId = requestData.brandId ?? 'shared';
    const brandAuthError = requireBrandAccess(user, brandId);
    if (brandAuthError) {
      console.log(`[${diagnosticId}] Brand access denied:`, brandAuthError);
      return createAuthErrorResponse(brandAuthError);
    }
    
    console.log(`[${diagnosticId}] Brand access authorized: ${brandId}`);

    // Step 6: Create authenticated context
    const context: TutorialComposerServiceContext = {
      userId: user.userId,
    };

    // Step 7: Create tutorial via V2 service
    console.log(`[${diagnosticId}] Calling tutorialComposerService.createTutorial...`);
    
    const tutorial = await tutorialComposerService.createTutorial(
      requestData,
      context
    );
    
    console.log(`[${diagnosticId}] Tutorial created successfully:`, {
      id: tutorial.id,
      subtopicId: tutorial.subtopicId,
      status: tutorial.status,
    });

    // Step 8: Invalidate cache (async, don't block response)
    // Cache invalidation will automatically fetch subtopic slug from database
    invalidateTutorialDeliveryCache(requestData.subtopicId).catch((error) => {
      console.error('[Tutorial Composer] Cache invalidation failed', {
        subtopicId: requestData.subtopicId,
        error,
      });
    });

    // Step 9: Format V2 response
    const response = TutorialResponseSchema.parse({
      id: tutorial.id,
      subtopicId: tutorial.subtopicId,
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
        brandId: filters.brandId,
        status: filters.status,
      },
      filters.limit,
      filters.cursor
    );

    // Step 5: Format V2 response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.tutorials.map((tutorial: any) => ({
      id: tutorial.id,
      subtopicId: tutorial.subtopicId,
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
