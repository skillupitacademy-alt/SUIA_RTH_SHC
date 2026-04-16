import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BFF Route: Get current user session
 * Pattern: UI → BFF → API Server → DB
 */
export async function GET(req: NextRequest) {
  try {
    const apiServerUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_SERVER_URL;
    
    if (!apiServerUrl) {
      console.error('[BFF][/api/auth/me] API_SERVER_URL not configured');
      return NextResponse.json({ user: null }, { status: 500 });
    }

    // Forward request to API server with cookies
    const res = await fetch(`${apiServerUrl}/api/auth/me`, {
      headers: {
        cookie: req.headers.get('cookie') || '',
        'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[BFF][/api/auth/me] API server returned non-OK status:', res.status);
      return NextResponse.json({ user: null }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error) {
    console.error('[BFF][/api/auth/me] Error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
