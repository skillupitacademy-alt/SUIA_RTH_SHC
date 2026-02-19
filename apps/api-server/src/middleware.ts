import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { corsMiddleware } from './modules/auth/cors.middleware';
import { csrfProtection, setCsrfToken } from './modules/auth/csrf.middleware';
import { rateLimit } from './modules/auth/rate-limit.middleware';
import { _verifyAdmin } from './modules/auth/rbac.service';
import { TokenService } from './modules/auth/token.service';

export default async function middleware(_request: NextRequest) {
  
  // 1. CORS Preflight
  if (_request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return corsMiddleware(_request, response);
  }

  // Only apply to /api routes
  if (!_request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Rate Limiting
  const rateLimitResponse = await rateLimit(_request);
  if (rateLimitResponse) {
    return corsMiddleware(_request, rateLimitResponse);
  }

  // 3. CSRF Protection for mutations
  const isAuthRoute = _request.nextUrl.pathname.startsWith('/api/auth') || 
                      _request.nextUrl.pathname.startsWith('/api/admin/auth');
  
  // Skip CSRF for auth routes (login/signup) which don't have tokens yet
  if (!isAuthRoute) {
    const csrfResponse = await csrfProtection(_request);
    if (csrfResponse) {
      return corsMiddleware(_request, csrfResponse);
    }
  }

  // 4. Auth Protection (Exclude public routes)
  // isAuthRoute already defined above
  const isPublicRoute = isAuthRoute || 
    _request.nextUrl.pathname === '/api/status';

  if (!isPublicRoute) {
    const pathname = _request.nextUrl.pathname;
    
    // 4.1 Determine Auth Scope (P0-SEC-004)
    let scope: 'admin' | 'user' = 'user';
    if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/factory') || pathname.startsWith('/api/analytics/admin')) {
      scope = 'admin';
    }

    const _token = TokenService.getAccessToken(_request, { scope });

    if (_token === undefined || _token === null || _token === '') {
      const response = NextResponse.json(
        { _error: 'Authentication required', scope },
        { status: 401 }
      );
      return corsMiddleware(_request, response);
    }

    try {
      // In middleware, we just want to ensure it's a valid, unexpired _token.
      const _payload = await TokenService.verifyAccessToken(_token, scope === 'admin');

      // 4.2 Central RBAC Enforcement (P0-SEC-002)
      const isAdminRoute = (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) || 
                           pathname.startsWith('/api/factory') ||
                           pathname.startsWith('/api/analytics/admin');

      if (isAdminRoute) {
        const hasAdminAccess = await _verifyAdmin(_payload);
        if (!hasAdminAccess) {
          const response = NextResponse.json(
            { _error: 'Forbidden: Admin access only' },
            { status: 403 }
          );
          return corsMiddleware(_request, response);
        }
      }
    } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : 'Authentication failed';
      const response = NextResponse.json(
        { _error: 'Invalid or expired _token', message: errorMessage },
        { status: 401 }
      );
      return corsMiddleware(_request, response);
    }
  }

  // 5. Proceed and add CORS headers
  const response = NextResponse.next();
  // Permanent Fix: Always re-issue/refresh CSRF _token on successful requests
  // ensure the client always has a fresh _token for the next mutation.
  setCsrfToken(response);
  return corsMiddleware(_request, response);
}

export const config = {
  matcher: '/api/:path*',
};
