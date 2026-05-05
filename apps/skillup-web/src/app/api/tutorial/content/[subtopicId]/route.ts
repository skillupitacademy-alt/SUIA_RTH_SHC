import { NextRequest, NextResponse } from 'next/server';
import { requireStudentAuth } from '@/lib/student-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial/content/:subtopicId
 * 
 * SkillUp BFF - Calls centralized Tutorial Engine in API server
 * UI/UX remains unchanged - only backend routing updated
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  try {
    const params = await context.params;
    
    // Authenticate user (SkillUp-specific)
    const authResult = await requireStudentAuth(request);
    if (!authResult.ok) {
      return authResult.response;
    }
    const user = { userId: authResult.userId };
    
    // Call API server with brand context
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'http://localhost:3000';
    const response = await fetch(
      `${apiUrl}/api/tutorial/content/${params.subtopicId}`,
      {
        headers: {
          'X-Brand': 'skillup',                    // Brand context
          'X-User-ID': user.userId,                // SkillUp user ID
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
        },
        cache: 'no-store'
      }
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch content' }));
      return NextResponse.json(
        { error: error.error || 'Tutorial content not found' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return with cache headers
    const result = NextResponse.json(data);
    result.headers.set('Cache-Control', 'public, max-age=3600');
    return result;
  } catch (error) {
    console.error('[SkillUp Tutorial Content] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}