/**
 * Tutorial Composer - Block Suggestions API
 * POST /api/tutorial-composer/block-suggestions
 * 
 * Generates intelligent block suggestions for TutorialDocument content.
 * 
 * ARCHITECTURE:
 * - Input: TutorialDocument + optional ContentAnalysisResult
 * - Output: BlockSuggestionResult with existing blocks + intelligent suggestions
 * - Pure analysis (NO database writes, NO mutations)
 * - Deterministic intelligence engine
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
import { blockSuggestionService, contentAnalysisService } from '@quiz/db-tutorial';
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
    if (authResult.error) {
      const { type, message } = authResult.error;
      const status = type === 'MISSING_TOKEN' || type === 'INVALID_TOKEN' ? 401 : 403;
      return NextResponse.json(
        createErrorResponse('UNAUTHENTICATED', message, status),
        { status }
      );
    }

    const { user } = authResult;

    // Step 2: Authorize - Tutorial Edit Permission
    const editAuthResult = await requireTutorialEditPermission(user);
    if (editAuthResult.error) {
      return NextResponse.json(
        createErrorResponse('FORBIDDEN', editAuthResult.error.message, 403),
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

    const { document, analysis, subtopicId, sectionType, brandId } = parseResult.data;

    // Step 4: Authorize - Subtopic Access (if provided)
    if (subtopicId) {
      const subtopicAuthResult = await requireSubtopicAccess(user, subtopicId);
      if (subtopicAuthResult.error) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', subtopicAuthResult.error.message, 403),
          { status: 403 }
        );
      }
    }

    // Step 5: Authorize - Brand Access (if provided)
    if (brandId) {
      const brandAuthResult = await requireBrandAccess(user, brandId);
      if (brandAuthResult.error) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', brandAuthResult.error.message, 403),
          { status: 403 }
        );
      }
    }

    // Step 6: Generate analysis if not provided
    // This allows clients to skip redundant analysis if they already have it from Prompt 06
    const analysisResult = analysis || contentAnalysisService.analyze(document);

    // Step 7: Generate block suggestions
    const suggestionResult = blockSuggestionService.generateSuggestions(
      document,
      analysisResult,
      {
        subtopicId,
        sectionType,
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
