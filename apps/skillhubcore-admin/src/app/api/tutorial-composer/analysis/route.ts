/**
 * Tutorial Composer API - Content Analysis
 * NEW Composer API route (clean separation from legacy)
 * 
 * POST /api/tutorial-composer/analysis - Analyze TutorialDocument
 * 
 * PROMPT 06 BACKEND IMPLEMENTATION
 */

import { NextRequest, NextResponse } from 'next/server';
import { TutorialDocumentSchema } from '@quiz/types';
import { contentAnalysisService } from '@quiz/db-tutorial';
import {
  authenticateRequest,
  createAuthErrorResponse,
  requireTutorialEditPermission,
  requireSubtopicAccess,
  requireBrandAccess,
} from '@/lib/auth-helpers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Helper: Create error response
 */
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * POST /api/tutorial-composer/analysis
 * Analyze TutorialDocument and return ContentAnalysisResult
 * 
 * ARCHITECTURE:
 * - Pure analysis (does NOT modify document)
 * - Does NOT write to database
 * - Deterministic calculations only
 * - Authentication + Authorization required
 * 
 * AUTHORIZATION FLOW:
 * 1. authenticateRequest() - verify JWT token
 * 2. requireTutorialEditPermission() - RBAC permission check
 * 3. requireSubtopicAccess() - verify subtopic access (if provided)
 * 4. requireBrandAccess() - verify brand access
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate request
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
        return createAuthErrorResponse(authResult);
      }
    } else {
      user = authResult.user;
    }

    // Step 2: Authorize tutorial editing permission (RBAC)
    const editPermissionError = requireTutorialEditPermission(user);
    if (editPermissionError) {
      return createAuthErrorResponse(editPermissionError);
    }

    // Step 3: Parse request body
    const body = await request.json();

    // Step 4: Validate TutorialDocument
    const parseResult = TutorialDocumentSchema.safeParse(body.document);
    if (!parseResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid TutorialDocument: ' + parseResult.error.errors[0]?.message,
        400
      );
    }

    const document = parseResult.data;
    const subtopicId = body.subtopicId; // Optional context
    const brandId = body.brandId || 'shared'; // Default to shared brand

    // Step 5: Authorize subtopic access (if subtopicId provided)
    if (subtopicId) {
      const subtopicAuthError = requireSubtopicAccess(user, subtopicId);
      if (subtopicAuthError) {
        return createAuthErrorResponse(subtopicAuthError);
      }
    }

    // Step 6: Authorize brand access
    const brandAuthError = requireBrandAccess(user, brandId);
    if (brandAuthError) {
      return createAuthErrorResponse(brandAuthError);
    }

    // Step 7: Analyze document (pure read-only operation)
    const analysisResult = contentAnalysisService.analyzeDocument(
      document,
      subtopicId
    );

    // Step 8: Validate result schema before returning
    const { ContentAnalysisResultSchema } = await import('@quiz/types');
    const validatedResult = ContentAnalysisResultSchema.parse(analysisResult);

    // Step 9: Return analysis result
    return NextResponse.json(
      { data: validatedResult },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Tutorial Composer] Analysis failed', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}
