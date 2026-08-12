import { NextRequest, NextResponse } from 'next/server';
import { requireStudent } from '@/lib/assignment-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial/content/:subtopicId
 * 
 * @deprecated LEGACY SYSTEM - Use /api/tutorial/sections/* instead
 * 
 * This endpoint queries the tutorial_content table which is incomplete/abandoned.
 * Production pages use /api/tutorial/sections/* with tutorial_sections table.
 * 
 * Migration Path:
 * - Current: /api/tutorial/content/* → tutorial_content (empty/incomplete)
 * - Recommended: /api/tutorial/sections/* → tutorial_sections (active/complete)
 * 
 * RTH BFF - Calls centralized Tutorial Engine in API server
 * UI/UX remains unchanged - only backend routing updated
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  try {
    const params = await context.params;
    
    console.log('[RTH Tutorial Content - DEPRECATED] Request for:', params.subtopicId);
    console.warn('[RTH Tutorial Content] ⚠️  DEPRECATION WARNING: Use /api/tutorial/sections/* instead');
    
    // Authenticate user (RTH-specific)
    const user = await requireStudent(request);
    
    console.log('[RTH Tutorial Content] User authenticated:', user.userId);
    
    // Call API server with brand context
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
    const apiEndpoint = `${apiUrl}/api/tutorial/content/${params.subtopicId}`;
    
    console.log('[RTH Tutorial Content] Calling API:', apiEndpoint);
    
    const response = await fetch(
      apiEndpoint,
      {
        headers: {
          'X-Brand': 'realtutorialhub',           // Brand context
          'X-User-ID': user.userId,                // RTH user ID
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
        },
        cache: 'no-store'
      }
    );
    
    console.log('[RTH Tutorial Content] API response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch content' }));
      
      console.error('[RTH Tutorial Content] API error:', {
        status: response.status,
        statusText: response.statusText,
        error: error
      });
      
      // CRITICAL: Preserve upstream status code for proper observability
      // 404 remains 404, 401 remains 401, 403 remains 403, 500 remains 500
      return NextResponse.json(
        { 
          error: error.error || 'Tutorial content not found',
          _deprecation: 'This endpoint is deprecated. Use /api/tutorial/sections/* instead.'
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    console.log('[RTH Tutorial Content] Success, returning data');
    
    // Return with cache headers and deprecation warning
    const result = NextResponse.json({
      ...data,
      _deprecation: 'This endpoint is deprecated. Use /api/tutorial/sections/* instead.'
    });
    result.headers.set('Cache-Control', 'public, max-age=3600');
    result.headers.set('X-Deprecated', 'true');
    result.headers.set('X-Deprecation-Message', 'Use /api/tutorial/sections/* instead');
    return result;
  } catch (error) {
    console.error('[RTH Tutorial Content] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
