/**
 * Tutorial Content API Endpoint
 * 
 * GET /api/tutorial/content/:subtopicId
 * 
 * Returns tutorial content with brand filtering and user progress.
 * Replaces BFF-based tutorial content retrieval.
 */

import { NextRequest, NextResponse } from 'next/server';

import type { TutorialBrand } from '@/modules/tutorial-engine';
import { TutorialService } from '@/modules/tutorial-engine';

export const dynamic = 'force-dynamic';

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
  
  // Default to realtutorialhub for backward compatibility
  return 'realtutorialhub';
}

/**
 * Extract user ID from request headers
 */
function extractUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

/**
 * GET /api/tutorial/content/:subtopicId
 * 
 * Returns tutorial content with brand filtering
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  try {
    const params = await context.params;
    const { subtopicId } = params;

    // Extract brand and user context
    const brandId = extractBrand(request);
    const userId = extractUserId(request);

    if (userId === null || userId === undefined || userId === '') {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get difficulty from query params
    const url = new URL(request.url);
    const difficulty = url.searchParams.get('difficulty') as 'simple' | 'mixed' | 'intermediate' | 'expert' | null;

    // Call tutorial service
    const tutorialService = new TutorialService();
    const result = await tutorialService.getContent({
      subtopicId,
      userId,
      brandId,
      difficulty: difficulty || 'simple'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    // Set cache headers
    const response = NextResponse.json({ data: result.data });
    response.headers.set('Cache-Control', 'public, max-age=3600');
    
    return response;
  } catch (error) {
    console.error('[Tutorial Content API] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
