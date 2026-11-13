/**
 * GET /api/tutorial/ils/navigation/:nodeId
 * 
 * SkillUp BFF - Proxies to centralized API server for navigation progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudentAuth } from '@/lib/student-auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nodeId: string }> }
) {
  try {
    const params = await context.params;
    
    // Authenticate user (SkillUp-specific)
    const authResult = await requireStudentAuth(request, { identity: 'learner' });
    if (!authResult.ok) {
      return authResult.response;
    }
    
    // Get query params
    const { searchParams } = new URL(request.url);
    const subtopicId = searchParams.get('subtopicId');
    
    if (!subtopicId || !z.string().uuid().safeParse(subtopicId).success || !params.nodeId || params.nodeId.length > 200) {
      return NextResponse.json(
        { error: 'Invalid navigation parameters' },
        { status: 400 }
      );
    }
    
    // Call API server with brand context
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
    const url = new URL(`${apiUrl}/tutorial/ils/navigation/${encodeURIComponent(params.nodeId)}`);
    url.searchParams.set('subtopicId', subtopicId);
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-Brand': 'skillup',
        'X-User-ID': authResult.learnerUserId,
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch navigation progress' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[SkillUp ILS] getNavigationProgress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
