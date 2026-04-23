import { NextRequest, NextResponse } from 'next/server';
import { extractAuthFromRequest, createInternalHeaders } from '../../../../../../src/share-branding/auth/unifiedBffAuth';

export const dynamic = 'force-dynamic';

/**
 * BFF Route: Submit onboarding preferences
 * Pattern: UI → BFF → API Server → DB
 * 
 * 🔥 CRITICAL FIX: Use unified BFF auth instead of manual cookie parsing
 */
export async function POST(req: NextRequest) {
  // 🔥 IMMEDIATE DEBUG: Log that handler is being called
  console.log('[BFF_ONBOARDING_HANDLER_ENTRY] Route handler called');
  
  try {
    // 🔥 CRITICAL: Use unified auth extraction
    const auth = await extractAuthFromRequest(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in' },
        { status: 401 }
      );
    }

    // 🔥 CRITICAL: Use INTERNAL_API_URL for server-side calls to avoid circular routing through Cloudflare
    const apiServerUrl = process.env.INTERNAL_API_URL || process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiServerUrl) {
      console.error('[BFF][/api/onboarding] API_SERVER_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await req.json();
    
    // 🔥 CRITICAL DEBUG: Log auth state
    console.log('[BFF_ONBOARDING]', JSON.stringify({
      isAuthenticated: auth.isAuthenticated,
      userId: auth.userId,
      brand: auth.brand,
    }));
    
    // 🔥 CRITICAL: Use unified header creation
    const headers = {
      ...createInternalHeaders(auth),
      'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
      'x-portal-identity': 'user',
    };

    // Forward request to API server with unified auth headers
    const res = await fetch(`${apiServerUrl}/auth/onboarding`, {
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
