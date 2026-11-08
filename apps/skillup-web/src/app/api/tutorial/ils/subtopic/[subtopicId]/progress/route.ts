/**
 * GET /api/tutorial/ils/subtopic/:subtopicId/progress
 * 
 * SkillUp BFF - Proxies to centralized API server for subtopic progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudentAuth } from '@/lib/student-auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  try {
    const params = await context.params;
    const authResult = await requireStudentAuth(request);
    if (!authResult.ok) {
      return authResult.response;
    }
    
    if (!z.string().uuid().safeParse(params.subtopicId).success) {
      return NextResponse.json({ error: 'Invalid subtopic ID' }, { status: 400 });
    }

    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
    const url = `${apiUrl}/api/tutorial/ils/subtopic/${params.subtopicId}/progress`;
    
    const response = await fetch(url, {
      headers: {
        'X-Brand': 'skillup',
        'X-User-ID': authResult.userId,
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch subtopic progress' }, { status: response.status });
    }
    
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('[SkillUp ILS] getSubtopicProgress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
