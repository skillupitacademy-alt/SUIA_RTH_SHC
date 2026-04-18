import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BFF Route: Submit onboarding preferences
 * Pattern: UI → BFF → API Server → DB
 * 
 * 🔥 CRITICAL FIX: Forward BOTH cookie AND Authorization header
 */
export async function POST(req: NextRequest) {
  try {
    const apiServerUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_SERVER_URL;
    
    if (!apiServerUrl) {
      console.error('[BFF][/api/onboarding] API_SERVER_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await req.json();
    
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    
    // Extract accessToken from cookies for Authorization header
    const accessToken = cookieHeader
      .split('; ')
      .find(c => c.startsWith('accessToken='))
      ?.split('=')[1];
    
    // Build headers - forward both cookie and create Authorization header
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
      'x-portal-identity': 'user',
    };
    
    // Forward cookie header
    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }
    
    // Add Authorization header (prefer explicit auth header, fallback to cookie token)
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward request to API server with cookies + Authorization
    const res = await fetch(`${apiServerUrl}/api/auth/onboarding`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[BFF][/api/onboarding] API server returned non-OK status:', res.status);
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF][/api/onboarding] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit onboarding' },
      { status: 500 }
    );
  }
}
