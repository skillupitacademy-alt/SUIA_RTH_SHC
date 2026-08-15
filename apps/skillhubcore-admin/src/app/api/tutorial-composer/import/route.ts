/**
 * Tutorial Composer API - Raw Content Import
 * Ingests raw Markdown, HTML, or Plain Text and produces a validated canonical TutorialDocument.
 * 
 * POST /api/tutorial-composer/import
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  RawContentImportRequestSchema,
  RawContentImportResponseSchema,
  TutorialDocumentValidationError,
  type ApiErrorCode,
  type ValidationErrorDetail,
} from '@quiz/types';
import { tutorialImportService } from '@quiz/db-tutorial';
import {
  authenticateRequest,
  createAuthErrorResponse,
  requireSubtopicAccess,
  requireBrandAccess,
} from '@/lib/auth-helpers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

function handleImportError(error: unknown) {
  console.error('[Tutorial Composer Import API] Error:', error);

  if (error instanceof TutorialDocumentValidationError) {
    return errorResponse(
      'TUTORIAL_DOCUMENT_INVALID',
      error.message || 'Tutorial document validation failed during import',
      422,
      error.validationErrors
    );
  }

  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred during raw content import', 500);
}

/**
 * POST /api/tutorial-composer/import
 * Ingest raw content and return parsed TutorialDocument with structural statistics
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

    // Step 2: Parse request body
    const body = await request.json();

    // Step 3: Validate request schema
    const parseResult = RawContentImportRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid raw content import request data',
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

    // Step 5: Authorize brand access (defaults to 'shared' if not provided)
    const brandId = requestData.brandId ?? 'shared';
    const brandAuthError = requireBrandAccess(user, brandId);
    if (brandAuthError) {
      return createAuthErrorResponse(brandAuthError);
    }

    // Step 6: Process raw content through import service
    const importResult = await tutorialImportService.importRawContent(requestData);

    // Step 7: Format and validate response schema
    const response = RawContentImportResponseSchema.parse(importResult);

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    return handleImportError(error);
  }
}
