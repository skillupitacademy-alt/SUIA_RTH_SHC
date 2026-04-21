import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BFF Route: Submit onboarding preferences
 * Pattern: UI → BFF → Gateway → API Server → DB
 * 🔥 GATEWAY-FIRST: All requests go through API Gateway
 */
export async function POST(req: NextRequest) {
  try {
    // 🔥 CRITICAL: Use GATEWAY_URL - NO direct API server access
    const hostname = req.headers.get('host') || req.nextUrl.hostname;
    const isSkillUp = hostname.includes('skillup');
    const gatewayUrl = isSkillUp 
      ? process.env.GATEWAY_URL_SKILLUP 
      : process.env.GATEWAY_URL;
    
    if (!gatewayUrl) {
      console.error('[BFF][/api/onboarding] GATEWAY_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await req.json();
    
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    
    console.log('[BFF_ONBOARDING]', JSON.stringify({
      hasCookie: cookieHeader.length > 0,
      hasAuthHeader: authHeader.length > 0,
      gatewayUrl,
    }));
    
    // Build headers - forward cookies and auth
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
      'x-portal-identity': 'user',
      'x-device-id': req.headers.get('x-device-id') || '',
      'x-device-name': req.headers.get('x-device-name') || '',
    };
    
    // Forward cookie header
    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }
    
    // Forward Authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward request to Gateway (which will route to API server)
    const res = await fetch(`${gatewayUrl}/auth/onboarding`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[BFF][/api/onboarding] Gateway returned non-OK status:', res.status);
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
