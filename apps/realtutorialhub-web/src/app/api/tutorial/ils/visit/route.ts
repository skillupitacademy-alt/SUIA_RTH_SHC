/**
 * POST /api/tutorial/ils/visit
 * 
 * RTH BFF - Proxies to centralized API server for visit recording
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
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
    const url = `${apiUrl}/tutorial/ils/visit`;
    
    // 🔍 ILS Phase 2: Log proxy target for E2E diagnostics
    console.log('[ILS_PROXY_TARGET]', JSON.stringify({
      brand: 'realtutorialhub',
      apiUrl,
      fullUrl: url,
      hasInternalApiUrl: !!process.env.INTERNAL_API_URL,
      hasGatewayUrl: !!process.env.GATEWAY_URL,
    }));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand': 'realtutorialhub',
        'X-User-ID': user.userId,
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
        'x-session-id': request.headers.get('x-session-id') || '', // ILS Phase 2: Forward learning session ID
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to record visit' }));
      return NextResponse.json(
        { error: error.error || 'Visit recording failed' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[RTH ILS] recordVisit error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
