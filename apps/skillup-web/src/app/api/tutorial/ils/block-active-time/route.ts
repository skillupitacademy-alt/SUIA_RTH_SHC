/**
 * POST /api/tutorial/ils/block-active-time
 * 
 * SkillUp BFF - Proxies to centralized API server for block active time recording
 * Phase 4.4: Block-level time tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (SkillUp-specific)
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
    
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    // Call API server with brand context
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
    const url = `${apiUrl}/tutorial/ils/block-active-time`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand': 'skillup',
        'X-User-ID': user.userId,
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
        'x-internal-key': process.env.INTERNAL_API_KEY || ''
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to record block active time' }));
      return NextResponse.json(
        { error: error.error || 'Block active time recording failed' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[SkillUp ILS] recordBlockActiveTime error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
