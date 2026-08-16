/**
 * Tutorial Composer - Presentation Ideas API
 * POST /api/tutorial-composer/presentation-ideas
 * 
 * PROMPT 14B: Generates intelligent presentation recommendations for Page 14
 * 
 * ARCHITECTURE:
 * - Input: TutorialDocument + ContentAnalysisResult + BlockSuggestionResult
 * - Output: PresentationIdeasResult with layout/visual recommendations
 * - Pure analysis (NO database writes, NO mutations)
 * - Deterministic recommendation engine
 * - concept-cards recommendations map to canonical card-grid block type
 * 
 * WORKFLOW:
 * 1. User provides document, analysis, and block suggestions
 * 2. Server generates deterministic presentation recommendations
 * 3. Client displays recommendations on Page 14
 * 4. User selects ideas and stores in sessionStorage
 * 5. Page 15 (Review & Approve) consumes selected ideas
 * 
 * SECURITY:
 * - Requires JWT authentication
 * - Requires TUTORIAL_AUTHOR_EDIT permission (RBAC)
 * - Requires subtopic access authorization
 * - Requires brand access authorization
 * - Server generates recommendations (client NEVER provides authoritative ideas)
 */

import { NextRequest, NextResponse } from 'next/server';
import { presentationIdeasService } from '@quiz/db-tutorial';
import {
  PresentationIdeasRequestSchema,
  createSuccessResponse,
  createErrorResponse,
  type PresentationIdeasResponse,
} from '@quiz/types';
import {
  authenticateRequest,
  requireTutorialEditPermission,
  requireSubtopicAccess,
  requireBrandAccess,
} from '@/lib/auth-helpers';

/**
 * POST /api/tutorial-composer/presentation-ideas
 * Generate presentation improvement recommendations
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
    } catch (error) {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid JSON in request body',
          400
        ),
        { status: 400 }
      );
    }

    const parseResult = PresentationIdeasRequestSchema.safeParse(body);
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

    const { document, analysis, blockSuggestions, subtopicId, sectionType, brandId } = parseResult.data;

    // Step 4: Validate that analysis and blockSuggestions are provided
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

    if (!blockSuggestions) {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'BlockSuggestionResult is required. Please call /api/tutorial-composer/block-suggestions first.',
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

    // Step 7: Generate presentation ideas
    // SECURITY: Server generates recommendations, client never provides authoritative ideas
    const presentationResult = presentationIdeasService.generatePresentationIdeas(
      document as any,
      analysis,
      blockSuggestions,
      {
        subtopicId,
        sectionType,
        brandId,
      }
    );

    // Step 8: Return success response
    const response: PresentationIdeasResponse = {
      data: presentationResult,
    };

    return NextResponse.json(createSuccessResponse(response, 200), {
      status: 200,
    });
  } catch (error) {
    console.error('[PRESENTATION-IDEAS] Unexpected error:', error);

    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred while generating presentation ideas',
        500
      ),
      { status: 500 }
    );
  }
}
