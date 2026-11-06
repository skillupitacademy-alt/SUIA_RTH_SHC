/**
 * Tutorial Progress API Endpoint
 *
 * GET /api/tutorial/progress?subtopicId=xxx
 * POST /api/tutorial/progress
 *
 * Handles tutorial progress tracking with brand context.
 */

import { TutorialProgressRepository } from '@quiz/db-tutorial';
import { calculateTutorialProgress, TUTORIAL_REQUIRED_MASTERY_SECTIONS } from '@quiz/validation';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import type { BlockType, TutorialBrand } from '@/modules/tutorial-engine';
import { TutorialService } from '@/modules/tutorial-engine';

export const dynamic = 'force-dynamic';

const blockTypeSchema = z.enum(TUTORIAL_REQUIRED_MASTERY_SECTIONS);

const postBodySchema = z.object({
  subtopicId: z.string().uuid(),
  blockType: blockTypeSchema,
  status: z.literal('viewed'),
});

interface AuthenticatedLearner {
  userId: string;
  brand: TutorialBrand;
}

/**
 * Containment for W1.2 Batch 08 (B08-E):
 * Cryptographically derives and verifies learner identity and canonical brand
 * from valid session credentials using TokenService.
 * Rejects unverified headers, client subject overrides, and cross-brand context.
 */
async function authenticateLearnerRequest(
  request: NextRequest
): Promise<{ authenticated?: AuthenticatedLearner; errorResponse?: NextResponse }> {
  const token = container.get(TokenService).getAccessToken(request, { scope: 'user' });
  if (token === null || token === undefined || token === '') {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  let payload;
  try {
    payload = await container.get(TokenService).verifyUserAccessToken(token);
  } catch {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      ),
    };
  }

  if (typeof payload?.userId !== 'string' || payload.userId.trim().length === 0) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Invalid token subject' },
        { status: 401 }
      ),
    };
  }

  if (payload.tokenType !== 'user' || payload.isAdmin === true) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Forbidden: Learner access only' },
        { status: 403 }
      ),
    };
  }

  if (payload.brand !== 'skillup' && payload.brand !== 'realtutorialhub') {
    return {
      errorResponse: NextResponse.json(
        { error: 'Forbidden: Non-tenant principal not permitted' },
        { status: 403 }
      ),
    };
  }

  const requestedBrand = request.headers.get('x-brand');
  if (requestedBrand !== null && requestedBrand.trim() !== '') {
    if (requestedBrand.toLowerCase() !== payload.brand.toLowerCase()) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden: Brand mismatch' },
          { status: 403 }
        ),
      };
    }
  }

  const requestedUserId = request.headers.get('x-user-id');
  if (requestedUserId !== null && requestedUserId.trim() !== '') {
    if (requestedUserId !== payload.userId) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden: User identity mismatch' },
          { status: 403 }
        ),
      };
    }
  }

  return {
    authenticated: {
      userId: payload.userId,
      brand: payload.brand as TutorialBrand,
    },
  };
}

/**
 * GET /api/tutorial/progress?subtopicId=xxx
 *
 * Get user progress for a subtopic
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateLearnerRequest(request);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const url = new URL(request.url);
    const subtopicId = url.searchParams.get('subtopicId');

    if (subtopicId === null || subtopicId === undefined || subtopicId === '') {
      return NextResponse.json(
        { error: 'subtopicId required' },
        { status: 400 }
      );
    }

    // Get progress directly from repository
    const { userId, brand } = authResult.authenticated!;
    const progressRepo = new TutorialProgressRepository();
    const progress = await progressRepo.getProgress(userId, subtopicId, brand);

    const blocksCompleted = progress?.blocksCompleted || [];
    const snapshot = calculateTutorialProgress({ completedSections: blocksCompleted });
    const assignmentUnlocked = snapshot.status === 'completed';

    return NextResponse.json(
      {
        data: {
          blocksCompleted,
          completionPercent: snapshot.completionPercent,
          assignmentUnlocked,
          progress: snapshot,
        }
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-cache' }
      }
    );
  } catch (error) {
    console.error('[Tutorial Progress API] GET Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tutorial/progress
 *
 * Track user progress (mark block as complete)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateLearnerRequest(request);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }
    const { userId, brand: brandId } = authResult.authenticated!;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Track progress
    const tutorialService = new TutorialService();
    const result = await tutorialService.trackProgress({
      userId,
      subtopicId: parsed.data.subtopicId,
      blockType: parsed.data.blockType as BlockType,
      brandId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: result.data },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-cache' }
      }
    );
  } catch (error) {
    console.error('[Tutorial Progress API] POST Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
