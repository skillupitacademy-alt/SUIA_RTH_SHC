/**
 * Tutorial Progress API Endpoint
 * 
 * GET /api/tutorial/progress?subtopicId=xxx
 * POST /api/tutorial/progress
 * 
 * Handles tutorial progress tracking with brand context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TutorialEngine, TutorialService } from '@/modules/tutorial-engine';
import type { TutorialBrand, BlockType } from '@/modules/tutorial-engine';
import { TutorialProgressRepository } from '@quiz/db-tutorial';

export const dynamic = 'force-dynamic';

const blockTypeSchema = z.enum(['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor']);

const postBodySchema = z.object({
  subtopicId: z.string().uuid(),
  blockType: blockTypeSchema,
  status: z.literal('viewed')
});

/**
 * Extract brand from request headers
 */
function extractBrand(request: NextRequest): TutorialBrand {
  const brandHeader = request.headers.get('x-brand');
  
  if (brandHeader === 'skillup') {
    return 'skillup';
  }
  
  if (brandHeader === 'realtutorialhub') {
    return 'realtutorialhub';
  }
  
  return 'realtutorialhub';
}

/**
 * Extract user ID from request headers
 */
function extractUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

/**
 * GET /api/tutorial/progress?subtopicId=xxx
 * 
 * Get user progress for a subtopic
 */
export async function GET(request: NextRequest) {
  try {
    const userId = extractUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const subtopicId = url.searchParams.get('subtopicId');

    if (!subtopicId) {
      return NextResponse.json(
        { error: 'subtopicId required' },
        { status: 400 }
      );
    }

    // Get progress directly from repository
    const progressRepo = new TutorialProgressRepository();
    const progress = await progressRepo.getProgress(userId, subtopicId);

    // Format progress
    const blocksCompleted = progress?.blocksCompleted || [];
    const completionPercent = Math.round((blocksCompleted.length / 6) * 100);
    const assignmentUnlocked = progress?.status === 'completed';

    return NextResponse.json(
      { 
        data: {
          blocksCompleted,
          completionPercent,
          assignmentUnlocked
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
    const userId = extractUserId(request);
    const brandId = extractBrand(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

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
      brandId
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
