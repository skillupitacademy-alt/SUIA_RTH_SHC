/**
 * POST /api/tutorial/ils/active-time
 * 
 * SkillUp BFF - Proxies to centralized API server for active time tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudentAuth } from '@/lib/student-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireStudentAuth(request);
    if (!authResult.ok) {
      return authResult.response;
    }
    
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
    const url = `${apiUrl}/api/tutorial/ils/active-time`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand': 'skillup',
        'X-User-ID': authResult.userId,
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to track active time' }));
      return NextResponse.json(error, { status: response.status });
    }
    
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('[SkillUp ILS] trackActiveTime error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
