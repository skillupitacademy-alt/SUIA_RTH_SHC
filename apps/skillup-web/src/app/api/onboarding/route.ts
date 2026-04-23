import { NextRequest, NextResponse } from 'next/server';
import { requireBffAuth, createInternalHeaders, BffAuthErrors } from '../../../../../../src/share-branding/auth/unifiedBffAuth';

export const dynamic = 'force-dynamic';

/**
 * BFF Route: Submit onboarding preferences
 * Pattern: UI → BFF → Gateway → API Server → DB
 * 🔥 GATEWAY-FIRST: All requests go through API Gateway
 */
export async function POST(req: NextRequest) {
  try {
    // 🔥 UNIFIED AUTH: Use standardized auth extraction
    const authResult = await requireBffAuth(req);
    
    // If requireBffAuth returns a Response, it's an error response
    if (authResult instanceof Response) {
      console.log('[BFF][/api/onboarding] Auth FAILED - returning error response');
      return authResult;
    }

    // 🔥 CRITICAL: Use GATEWAY_URL - NO direct API server access
    const hostname = req.headers.get('host') || req.nextUrl.hostname;
    const isSkillUp = hostname.includes('skillup');
    const gatewayUrl = isSkillUp 
      ? process.env.GATEWAY_URL_SKILLUP 
      : process.env.GATEWAY_URL;
    
    if (!gatewayUrl) {
      console.error('[BFF][/api/onboarding] GATEWAY_URL not configured');
      return BffAuthErrors.internalError('Server configuration error');
    }

    // Parse request body
    const body = await req.json();
    
    console.log('[BFF_ONBOARDING]', JSON.stringify({
      userId: authResult.userId?.slice(0, 8),
      brand: authResult.brand,
      gatewayUrl,
    }));
    
    // 🔥 UNIFIED HEADERS: Use standardized header creation
    const headers = createInternalHeaders(authResult);
    
    // Add additional headers for gateway
    headers['x-request-id'] = req.headers.get('x-request-id') || crypto.randomUUID();
    headers['x-portal-identity'] = 'user';
    headers['x-device-id'] = req.headers.get('x-device-id') || '';
    headers['x-device-name'] = req.headers.get('x-device-name') || '';

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
    return BffAuthErrors.internalError('Failed to submit onboarding');
  }
}
