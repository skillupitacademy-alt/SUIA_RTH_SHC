/**
 * Tutorial Content API Endpoint
 * 
 * @deprecated LEGACY SYSTEM - Use /api/tutorial/sections/* instead
 * 
 * GET /api/tutorial/content/:subtopicId
 * 
 * ⚠️  DEPRECATION NOTICE:
 * This endpoint queries the tutorial_content table which is incomplete/abandoned.
 * Production pages use /api/tutorial/sections/* with tutorial_sections table.
 * 
 * Architecture Migration:
 * - Legacy: tutorial_content (monolithic, incomplete, empty for most subtopics)
 * - Current: tutorial_sections (modular, complete, powers production pages)
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

    console.log('[Tutorial Content API - DEPRECATED] Request for:', subtopicId);
    console.warn('[Tutorial Content API] ⚠️  DEPRECATION WARNING: Use /api/tutorial/sections/* instead');

    // Extract brand and user context
    const brandId = extractBrand(request);
    const userId = extractUserId(request);

    console.log('[Tutorial Content API] Brand:', brandId, 'User:', userId);

    if (userId === null || userId === undefined || userId === '') {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get difficulty from query params
    const url = new URL(request.url);
    const difficulty = url.searchParams.get('difficulty') as 'simple' | 'mixed' | 'intermediate' | 'expert' | null;

    console.log('[Tutorial Content API] Difficulty:', difficulty || 'simple');

    // Call tutorial service
    const tutorialService = new TutorialService();
    const result = await tutorialService.getContent({
      subtopicId,
      userId,
      brandId,
      difficulty: difficulty || 'simple'
    });

    // ✅ SECURITY: Brand authorization check
    if (result.success && result.data) {
      const tutorialBrand = result.data.brand;
      const userBrand = brandId;

      // Check brand access: allow if tutorial is shared, or brands match
      if (tutorialBrand !== 'shared' && tutorialBrand !== userBrand) {
        console.warn('[Tutorial Content API] Brand mismatch:', { userBrand, tutorialBrand });
        return NextResponse.json(
          { error: 'Access denied: Brand mismatch' },
          { status: 403 }
        );
      }
    }

    // Continue with existing logic
    const originalResult = result;

    // Continue with existing logic
    const originalResult = result;

    if (!originalResult.success) {
      console.error('[Tutorial Content API] Content not found:', originalResult.error);
      console.warn('[Tutorial Content API] This likely means tutorial_content table is empty for this subtopic');
      console.warn('[Tutorial Content API] Recommendation: Use /api/tutorial/sections/* which queries tutorial_sections table');
      
      return NextResponse.json(
        { 
          error: originalResult.error,
          _deprecation: 'This endpoint is deprecated. Use /api/tutorial/sections/* instead.',
          _recommendation: 'The tutorial_content table is incomplete. Use tutorial_sections system.'
        },
        { status: 404 }
      );
    }

    console.log('[Tutorial Content API] Success, returning data');

    // Set cache headers with deprecation warning
    const response = NextResponse.json({ 
      data: originalResult.data,
      _deprecation: 'This endpoint is deprecated. Use /api/tutorial/sections/* instead.'
    });
    response.headers.set('Cache-Control', 'public, max-age=3600');
    response.headers.set('X-Deprecated', 'true');
    response.headers.set('X-Deprecation-Message', 'Use /api/tutorial/sections/* instead');
    
    return response;
  } catch (error) {
    console.error('[Tutorial Content API] Unexpected error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
