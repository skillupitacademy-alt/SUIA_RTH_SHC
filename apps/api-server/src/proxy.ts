// Edge-compatible UUID generation using standard web crypto
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { corsMiddleware } from './modules/auth/cors.middleware';
import { csrfProtection, setCsrfToken } from './modules/auth/csrf.middleware';
import { _verifyAdmin } from './modules/auth/rbac.service';
import { TokenService } from './modules/auth/token.service';

export async function proxy(request: NextRequest) {
  // 1. Ensure a requestId and sessionId exist and are forwarded downstream
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const sessionId = request.headers.get('x-session-id') ?? 'anon-' + crypto.randomUUID().slice(0, 8);
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-session-id', sessionId);

  // 2. CORS Preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return corsMiddleware(request, response);
  }

  // 3. Only apply to /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  }

  // 4. CSRF Protection for mutations
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth') || 
                      request.nextUrl.pathname.startsWith('/api/admin/auth');
  
  if (!isAuthRoute) {
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse !== null && csrfResponse !== undefined) {
      return corsMiddleware(request, csrfResponse);
    }
  }

  // 5. Auth Protection
  const isPublicRoute = isAuthRoute || request.nextUrl.pathname === '/api/status';

  if (!isPublicRoute) {
    const pathname = request.nextUrl.pathname;
    const portalIdentity = request.headers.get('x-portal-identity') ?? 'user';
    let scope: 'admin' | 'user' | 'infrastructure' = 'user';
    let expectedAudience: 'admin' | 'user' | 'infra' = 'user';

    if (portalIdentity === 'infrastructure') {
        scope = 'infrastructure';
        expectedAudience = 'infra';
    } else if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/factory') || pathname.startsWith('/api/analytics/admin') || portalIdentity === 'admin') {
        scope = 'admin';
        expectedAudience = 'admin';
    }

    const _token = TokenService.getAccessToken(request, { scope });
    const internalKey = request.headers.get('x-internal-key');
    const authHeader = request.headers.get('authorization');
    
    const isValidInternalKey = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;
    const isValidCronAuth = authHeader !== null && process.env.CRON_SECRET !== undefined && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    
    const isSystemBypass = isValidInternalKey || isValidCronAuth;

    if (!isSystemBypass && (_token === undefined || _token === null || _token === '')) {
      const response = NextResponse.json(
        { error: 'Authentication required', scope },
        { status: 401 }
      );
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-session-id', sessionId);
      return corsMiddleware(request, response);
    }

    if (!isSystemBypass) {
      try {
        const isAdmin = scope === 'admin' || scope === 'infrastructure';
        const _payload = await TokenService.verifyAccessToken(_token!, { isAdmin, audience: expectedAudience });

        const isInfraRoute = pathname.startsWith('/api/admin') && portalIdentity === 'infrastructure';
        const isAdminRoute = (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth') && portalIdentity !== 'infrastructure') || 
                             pathname.startsWith('/api/factory') ||
                             pathname.startsWith('/api/analytics/admin');

        if (isInfraRoute) {
            const roles = Array.isArray(_payload.roles) ? (_payload.roles as string[]) : [];
            if (!roles.includes('INFRASTRUCTURE')) {
              const res = NextResponse.json({ error: 'Forbidden: Infrastructure privileges required' }, { status: 403 });
              res.headers.set('x-request-id', requestId);
              return corsMiddleware(request, res);
            }
        } else if (isAdminRoute) {
          const hasAdminAccess = await _verifyAdmin(_payload);
          if (!hasAdminAccess) {
            const res = NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
            res.headers.set('x-request-id', requestId);
            return corsMiddleware(request, res);
          }
        }
      } catch (_error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : 'Authentication failed';
        const res = NextResponse.json({ error: 'Invalid or expired token', message: errorMessage }, { status: 401 });
        res.headers.set('x-request-id', requestId);
        return corsMiddleware(request, res);
      }
    }
  }

  // 6. Finalize Response using modern proxy forwarding
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });
  
  setCsrfToken(response);
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-session-id', sessionId);
  
  // Expose headers to frontend
  response.headers.set('Access-Control-Expose-Headers', 'x-request-id, x-session-id, x-csrf-token, X-Duration-Ms');
  
  return corsMiddleware(request, response);
}

export const config = {
  matcher: '/api/:path*',
};
