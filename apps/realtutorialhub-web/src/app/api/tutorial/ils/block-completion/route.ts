/**
 * POST /api/tutorial/ils/block-completion
 * 
 * RTH BFF - Proxies to centralized API server for block completion recording
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';
import { serverErrorResponse } from '@/share-branding/api/server-error';

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
    const url = `${apiUrl}/tutorial/ils/block-completion`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand': 'realtutorialhub',
        'X-User-ID': user.userId,
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
        'x-internal-key': process.env.INTERNAL_API_KEY || ''
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status >= 500) {
        return serverErrorResponse(request, response.status, 'Block completion service unavailable');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to record block completion' }));
      return NextResponse.json(
        { error: error.error || 'Block completion recording failed' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    return serverErrorResponse(request, 500, 'Internal server error', error);
  }
}
