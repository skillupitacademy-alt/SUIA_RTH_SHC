import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BFF Route: Submit onboarding preferences
 * Pattern: UI → BFF → API Server → DB
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

    // Forward request to API server with cookies
    const res = await fetch(`${apiServerUrl}/api/onboarding`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: req.headers.get('cookie') || '',
        'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
      },
      body: JSON.stringify(body),
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
