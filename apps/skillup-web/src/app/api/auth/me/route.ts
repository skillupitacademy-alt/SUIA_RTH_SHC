import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BFF Route: Get current user session
 * Pattern: UI → BFF → Gateway → API Server → DB
 * 🔥 GATEWAY-FIRST: All requests go through API Gateway
 */
export async function GET(req: NextRequest) {
  try {
    const gatewayUrl = process.env.GATEWAY_URL;
    
    if (!gatewayUrl) {
      console.error('[BFF][/api/auth/me] GATEWAY_URL not configured');
      return NextResponse.json({ user: null }, { status: 500 });
    }

    console.log('[BFF][/api/auth/me] Using gateway URL:', gatewayUrl);

    // Forward request to gateway with proper headers
    const cookieHeader = req.headers.get('cookie') || '';
    const accessToken = cookieHeader
      .split('; ')
      .find(c => c.startsWith('accessToken='))
      ?.split('=')[1];

    if (!accessToken) {
      console.warn('[BFF][/api/auth/me] No access token found in cookies');
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'cookie': cookieHeader,
      'Authorization': `Bearer ${accessToken}`,
      'x-portal-identity': 'user',
      'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
      'x-device-id': req.headers.get('x-device-id') || '',
      'x-device-name': req.headers.get('x-device-name') || '',
    };

    console.log('[BFF][/api/auth/me] Calling gateway with headers:', Object.keys(headers));

    const res = await fetch(`${gatewayUrl}/auth/me`, {
      headers,
      cache: 'no-store',
    });

    console.log('[BFF][/api/auth/me] Gateway response status:', res.status);

    if (!res.ok) {
      console.warn('[BFF][/api/auth/me] Gateway returned non-OK status:', res.status);
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
