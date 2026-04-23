import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { 
  createInternalHeaders, 
  BffAuthErrors,
  requireBffAuth 
} from './unifiedBffAuth';

/**
 * 🔐 SHARED BFF PROFILE HANDLER
 * 
 * Single implementation used by both brands to eliminate code duplication.
 * 
 * Architecture: Browser → BFF → API Server
 * 
 * Flow:
 * 1. Browser sends cookies (Set-Cookie from login)
 * 2. BFF uses unified auth extraction (unifiedBffAuth.ts)
 * 3. BFF validates JWT and extracts identity
 * 4. BFF creates standardized internal headers
 * 5. BFF calls API Server with internal headers
 * 6. API Server validates internal secret + userId
 * 7. API Server returns profile
 * 
 * Security:
 * - ✅ Unified auth validation (consistent across all BFF routes)
 * - ✅ Standardized error responses
 * - ✅ Internal secret verification (API side)
 * - ✅ Correlation ID tracking (debugging)
 * - ✅ Comprehensive logging (no silent failures)
 */

// 🔥 INTERNAL API: Direct service-to-service calls (bypasses gateway)
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || process.env.API_SERVER_URL || 'http://localhost:3001';

/**
 * GET /api/profile
 * 
 * Retrieves user profile from API Server
 */
export async function handleProfileGet(req: NextRequest) {
  const perfStart = Date.now();
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

  // 🔥 RUNTIME ENV TRACE
  const secret = process.env.INTERNAL_GATEWAY_SECRET;
  console.log("[ENV TRACE]", JSON.stringify({
    service: process.env.K_SERVICE,
    revision: process.env.K_REVISION,
    length: secret?.length,
    prefix: secret?.slice(0, 8),
    hasQuotes: secret?.includes('"'),
    envKeys: Object.keys(process.env)
      .filter(k => k.includes('SECRET'))
      .sort(),
  }));

  try {
    console.log(`[BFF][Profile GET][${correlationId}] Request started`);

    // 🔥 UNIFIED AUTH: Replace custom extraction with standardized approach
    const authResult = await requireBffAuth(req);
    
    // If requireBffAuth returns a Response, it's an error response
    if (authResult instanceof Response) {
      console.log(`[BFF][Profile GET][${correlationId}] Auth FAILED - returning error response`);
      return authResult;
    }

    // Auth successful - authResult contains the validated auth data
    console.log(`[BFF][Profile GET][${correlationId}] Auth SUCCESS - calling API`);

    // 🔥 UNIFIED HEADERS: Use standardized internal header creation
    const headers = createInternalHeaders(authResult);
    
    // Add correlation ID for debugging
    headers['x-correlation-id'] = correlationId;
    
    // 🔍 DEBUG: Verify secret is being sent
    console.log(`[BFF DEBUG][${correlationId}]`, {
      sendingSecret: headers['x-gateway-secret']?.slice(0, 10),
      sendingUserId: headers['x-user-id'],
      sendingBrand: headers['x-brand'],
      apiUrl: INTERNAL_API_URL,
    });

    // Call API Server
    const res = await fetch(`${INTERNAL_API_URL}/auth/profile`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await res.json();
    const duration = Date.now() - perfStart;

    console.log(`[BFF][Profile GET][${correlationId}] API response: ${res.status} (${duration}ms)`);

    if (res.status === 404) {
      return NextResponse.json(
        {
          error: 'Profile not found',
          message: 'Please complete onboarding first',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const duration = Date.now() - perfStart;
    console.error(`[BFF][Profile GET][${correlationId}] Error (${duration}ms):`, err);
    return BffAuthErrors.internalError('Profile retrieval failed');
  }
}

/**
 * PATCH /api/profile
 * 
 * Updates user profile via API Server
 */
export async function handleProfilePatch(req: NextRequest) {
  const perfStart = Date.now();
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

  try {
    console.log(`[BFF][Profile PATCH][${correlationId}] Request started`);

    // 🔥 UNIFIED AUTH: Replace custom extraction with standardized approach
    const authResult = await requireBffAuth(req);
    
    // If requireBffAuth returns a Response, it's an error response
    if (authResult instanceof Response) {
      console.log(`[BFF][Profile PATCH][${correlationId}] Auth FAILED - returning error response`);
      return authResult;
    }

    // Auth successful - authResult contains the validated auth data
    console.log(`[BFF][Profile PATCH][${correlationId}] Auth SUCCESS - calling API`);

    const body = await req.json();

    // 🔥 UNIFIED HEADERS: Use standardized internal header creation
    const headers = createInternalHeaders(authResult);
    
    // Add correlation ID for debugging
    headers['x-correlation-id'] = correlationId;
    
    // 🔍 DEBUG: Verify secret is being sent
    console.log(`[BFF DEBUG][${correlationId}]`, {
      sendingSecret: headers['x-gateway-secret']?.slice(0, 10),
      sendingUserId: headers['x-user-id'],
      sendingBrand: headers['x-brand'],
      apiUrl: INTERNAL_API_URL,
    });

    // Call API Server
    const res = await fetch(`${INTERNAL_API_URL}/auth/profile`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json();
    const duration = Date.now() - perfStart;

    console.log(`[BFF][Profile PATCH][${correlationId}] API response: ${res.status} (${duration}ms)`);

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const duration = Date.now() - perfStart;
    console.error(`[BFF][Profile PATCH][${correlationId}] Error (${duration}ms):`, err);
    return BffAuthErrors.internalError('Profile update failed');
  }
}
