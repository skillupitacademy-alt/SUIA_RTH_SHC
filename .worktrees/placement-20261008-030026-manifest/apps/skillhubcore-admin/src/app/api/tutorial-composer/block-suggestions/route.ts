/**
 * Tutorial Composer - Block Suggestions API
 * POST /api/tutorial-composer/block-suggestions
 * 
 * Generates intelligent block suggestions for TutorialDocument content.
 * 
 * ARCHITECTURE:
 * - Input: TutorialDocument + ContentAnalysisResult (REQUIRED)
 * - Output: BlockSuggestionResult with existing blocks + intelligent suggestions
 * - Pure analysis (NO database writes, NO mutations)
 * - Deterministic intelligence engine
 * 
 * REQUIREMENTS:
 * - Must call POST /api/tutorial-composer/analysis FIRST to get ContentAnalysisResult
 * - Analysis result is REQUIRED for Summary suggestions and quality assessment
 * 
 * SECURITY:
 * - Requires JWT authentication
 * - Requires TUTORIAL_AUTHOR_EDIT permission (RBAC)
 * - Requires subtopic access authorization
 * - Requires brand access authorization
 * 
 * PROMPT 07B BACKEND IMPLEMENTATION
 */

import { NextRequest, NextResponse } from 'next/server';
import { blockSuggestionService } from '@quiz/db-tutorial';
import {
  BlockSuggestionsRequestSchema,
  createSuccessResponse,
  createErrorResponse,
  type BlockSuggestionsResponse,
} from '@quiz/types';
import {
  authenticateRequest,
  requireTutorialEditPermission,
  requireSubtopicAccess,
  requireBrandAccess,
} from '@/lib/auth-helpers';

/**
 * POST /api/tutorial-composer/block-suggestions
 * Generate block suggestions for tutorial content
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate
    const authResult = await authenticateRequest(request);
    let user;
    if ('type' in authResult) {
      // Dev auth bypass is ONLY permitted when explicitly enabled in local development environment
      const isExplicitDevBypass =
        process.env.NODE_ENV === 'development' &&
        (process.env.TUTORIAL_COMPOSER_DEV_AUTH_BYPASS === 'true' ||
          request.headers.get('x-tutorial-dev-bypass') === 'true');

      if (isExplicitDevBypass) {
        user = {
          userId: 'dev-admin-preview',
          originalUserId: 'dev-admin-preview',
          shadowUserId: 'dev-admin-preview',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          roles: ['admin', 'super_admin'] as any[],
          isAdmin: true,
          email: 'admin@skillhubcore.local',
        };
      } else {
        const { type, message } = authResult;
        const status = type === 'MISSING_TOKEN' || type === 'INVALID_TOKEN' ? 401 : 403;
        return NextResponse.json(
          createErrorResponse('UNAUTHENTICATED', message, status),
          { status }
        );
      }
    } else {
      user = authResult.user;
    }

    // Step 2: Authorize - Tutorial Edit Permission
    const editAuthError = requireTutorialEditPermission(user);
    if (editAuthError) {
      return NextResponse.json(
        createErrorResponse('FORBIDDEN', editAuthError.message, 403),
        { status: 403 }
      );
    }

    // Step 3: Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid JSON in request body',
          400
        ),
        { status: 400 }
      );
    }

    const parseResult = BlockSuggestionsRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Request validation failed',
          422,
          parseResult.error.errors.map((e) => ({
            code: e.code,
            message: e.message,
            path: e.path.join('.'),
          }))
        ),
        { status: 422 }
      );
    }

    const { document, analysis, subtopicId, brandId } = parseResult.data;
    // sectionType is available but unused in current implementation

    // Step 4: Validate that analysis is provided (required for Summary suggestions)
    if (!analysis) {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'ContentAnalysisResult is required. Please call /api/tutorial-composer/analysis first.',
          422
        ),
        { status: 422 }
      );
    }

    // Step 5: Authorize - Subtopic Access (if provided)
    if (subtopicId) {
      const subtopicAuthError = requireSubtopicAccess(user, subtopicId);
      if (subtopicAuthError) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', subtopicAuthError.message, 403),
          { status: 403 }
        );
      }
    }

    // Step 6: Authorize - Brand Access (if provided)
    if (brandId) {
      const brandAuthError = requireBrandAccess(user, brandId);
      if (brandAuthError) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', brandAuthError.message, 403),
          { status: 403 }
        );
      }
    }

    // Step 7: Generate block suggestions (analysis is REQUIRED)
    // Type assertion: After successful Zod validation, document has all required fields
    const suggestionResult = blockSuggestionService.generateSuggestions(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document as any,
      analysis,
      {
        subtopicId,
        brandId,
      }
    );

    // Step 8: Return success response
    const response: BlockSuggestionsResponse = {
      data: suggestionResult,
    };

    return NextResponse.json(createSuccessResponse(response, 200), {
      status: 200,
    });
  } catch (error) {
    console.error('[BLOCK-SUGGESTIONS] Unexpected error:', error);

    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred while generating block suggestions',
        500
      ),
      { status: 500 }
    );
  }
}
