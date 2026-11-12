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

    // Authenticate user (RTH-specific)
    let user;
    try {
      user = await requireStudent(request);
    } catch (error) {
      if (error instanceof AssignmentAuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode, headers: { 'Cache-Control': 'private, no-store' } }
        );
      }
      throw error;
    }

    // Get query params
    const { searchParams } = new URL(request.url);

    // Build API server URL with query params
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
    const url = new URL(`${apiUrl}/tutorial/sections/${params.subtopicId}`);
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Call API server with brand context
    const response = await fetch(url.toString(), {
      headers: {
        'X-Brand': 'realtutorialhub',           // Brand context
        'X-User-ID': user.userId,                // RTH user ID
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch sections' }));
      return NextResponse.json(
        { error: error.error || 'Tutorial sections not found' },
        { status: response.status, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    });

  } catch (error) {
    console.error('[RTH Tutorial Sections] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
