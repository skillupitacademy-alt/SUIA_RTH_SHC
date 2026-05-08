import { NextRequest, NextResponse } from 'next/server';
import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial/sections/:subtopicId
 * 
 * RTH BFF - Calls centralized API server for tutorial sections
 * Uses same authentication pattern as /api/tutorial/content/
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  try {
    const params = await context.params;
    
    console.log('[RTH Tutorial Sections] Request received for:', params.subtopicId);
    console.log('[RTH Tutorial Sections] Cookies:', request.cookies.getAll().map(c => c.name));
    
    // Authenticate user (RTH-specific)
    let user;
    try {
      user = await requireStudent(request);
    } catch (error) {
      if (error instanceof AssignmentAuthError) {
        console.error('[RTH Tutorial Sections] Auth error:', error.message);
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      throw error;
    }
    
    console.log('[RTH Tutorial Sections] User authenticated:', user.userId);
    
    // Get query params
    const { searchParams } = new URL(request.url);
    
    // Build API server URL with query params
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'http://localhost:3000';
    const url = new URL(`${apiUrl}/tutorial/sections/${params.subtopicId}`);
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    
    console.log('[RTH Tutorial Sections] Calling API server:', url.toString());
    
    // Call API server with brand context
    const response = await fetch(url.toString(), {
      headers: {
        'X-Brand': 'realtutorialhub',           // Brand context
        'X-User-ID': user.userId,                // RTH user ID
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
      },
      cache: 'no-store'
    });
    
    console.log('[RTH Tutorial Sections] API response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch sections' }));
      console.log('[RTH Tutorial Sections] API error:', error);
      return NextResponse.json(
        { error: error.error || 'Tutorial sections not found' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('[RTH Tutorial Sections] Success, returning data');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[RTH Tutorial Sections] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
