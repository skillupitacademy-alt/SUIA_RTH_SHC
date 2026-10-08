/**
 * GET /api/tutorial/ils/subtopic/:subtopicId/progress
 * 
 * RTH BFF - Proxies to centralized API server for subtopic progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';

export const dynamic = 'force-dynamic';

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
          { status: error.statusCode }
        );
      }
      throw error;
    }
    
    // Call API server with brand context
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
    const url = `${apiUrl}/api/tutorial/ils/subtopic/${params.subtopicId}/progress`;
    
    const response = await fetch(url, {
      headers: {
        'X-Brand': 'realtutorialhub',
        'X-User-ID': user.userId,
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch subtopic progress' }));
      return NextResponse.json(
        { error: error.error || 'Subtopic progress not found' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[RTH ILS] getSubtopicProgress error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
