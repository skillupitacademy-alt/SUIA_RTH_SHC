/**
 * Tutorial Composer API - Block Management
 * Phase 2E: Append block instances to existing sections
 * 
 * POST /api/tutorial-composer/sections/:sectionId/blocks - Append new block
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  TutorialSectionResponseSchema,
  type ApiErrorCode,
  type ValidationErrorDetail,
  type TutorialBlock,
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
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Request schema for appending a block
 */
const AppendBlockRequestSchema = z.object({
  block: z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    version: z.string().min(1),
    content: z.unknown(),
    presentation: z.unknown().optional(),
  }),
});

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
  console.error('Tutorial Composer Block API Error:', error);

  if (error instanceof TutorialDocumentValidationError) {
    return errorResponse(
      'TUTORIAL_DOCUMENT_INVALID',
      'Block validation failed',
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
 * POST /api/tutorial-composer/sections/:sectionId/blocks
 * Append new block instance to existing section
 * 
 * Phase 2E: This endpoint enables adding multiple block instances
 * of the same or different types to a TutorialDocument
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
    const parseResult = AppendBlockRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid block data',
        400,
        parseResult.error.errors.map((err) => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          path: err.path.join('.'),
        }))
      );
    }

    const { block } = parseResult.data;

    // Step 7: Create authenticated context
    const context: TutorialComposerServiceContext = {
      userId: user.userId,
    };

    // Step 8: Append block to section
    const updatedSection = await tutorialComposerService.appendBlockToSection(
      sectionId,
      block as TutorialBlock,
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
      id: updatedSection.id,
      subtopicId: updatedSection.subtopicId,
      sectionType: updatedSection.sectionType,
      difficulty: updatedSection.difficulty,
      orderIndex: updatedSection.orderIndex,
      content: updatedSection.content,
      version: updatedSection.version,
      language: updatedSection.language,
      status: updatedSection.status,
      brandId: updatedSection.brandId,
      generatedByAi: updatedSection.generatedByAi,
      aiModelUsed: updatedSection.aiModelUsed,
      qualityScore: updatedSection.qualityScore,
      createdAt: updatedSection.createdAt.toISOString(),
      updatedAt: updatedSection.updatedAt.toISOString(),
      publishedAt: updatedSection.publishedAt?.toISOString() || null,
    });

    return NextResponse.json({ 
      data: response,
      message: 'Block appended successfully',
    }, { status: 200 });
  } catch (error) {
    return handleServiceError(error);
  }
}
