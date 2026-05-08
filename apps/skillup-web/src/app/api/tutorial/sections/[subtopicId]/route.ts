import { NextRequest, NextResponse } from 'next/server';
import { requireStudentAuth } from '@/lib/student-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial/sections/:subtopicId
 * 
 * SkillUp BFF - Calls centralized API server for tutorial sections
 * Uses same authentication pattern as other SkillUp routes
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
    
    // Get query params
    const { searchParams } = new URL(request.url);
    
    // Build API server URL with query params
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'http://localhost:3000';
    const url = new URL(`${apiUrl}/tutorial/sections/${params.subtopicId}`);
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    
    // Call API server with brand context
    const response = await fetch(url.toString(), {
      headers: {
        'X-Brand': 'skillup',                    // Brand context
        'X-User-ID': authResult.userId,          // SkillUp user ID
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch sections' }));
      return NextResponse.json(
        { error: error.error || 'Tutorial sections not found' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[SkillUp Tutorial Sections] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
