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
  const hasRateLimitResponse = rateLimitResponse !== null;
  if (hasRateLimitResponse) {
    return corsMiddleware(_request, rateLimitResponse);
  }

  // 3. CSRF Protection for mutations
  const isAuthRoute = _request.nextUrl.pathname.startsWith('/api/auth') || 
                      _request.nextUrl.pathname.startsWith('/api/admin/auth');
  
  // Skip CSRF for auth routes (login/signup) which don't have tokens yet
  if (!isAuthRoute) {
    const csrfResponse = await csrfProtection(_request);
    if (csrfResponse !== null && csrfResponse !== undefined) {
      return corsMiddleware(_request, csrfResponse);
    }
  }

  // 4. Auth Protection (Exclude public routes)
  const isPublicRoute = isAuthRoute || 
    _request.nextUrl.pathname === '/api/status';

  if (!isPublicRoute) {
    const pathname = _request.nextUrl.pathname;
    
    // 4.1 Determine Auth Scope & Audience (P0-SEC-004)
    const portalIdentity = _request.headers.get('x-portal-identity') ?? 'user';
    let scope: 'admin' | 'user' | 'infrastructure' = 'user';
    let expectedAudience: 'admin' | 'user' | 'infra' = 'user';

    if (portalIdentity === 'infrastructure') {
        scope = 'infrastructure';
        expectedAudience = 'infra';
    } else if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/factory') || pathname.startsWith('/api/analytics/admin') || portalIdentity === 'admin') {
        scope = 'admin';
        expectedAudience = 'admin';
    }

    const _token = TokenService.getAccessToken(_request, { scope });
    const internalKey = _request.headers.get('x-internal-key');
    const authHeader = _request.headers.get('authorization');
    
    const isValidInternalKey = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;
    const isValidCronAuth = authHeader !== null && process.env.CRON_SECRET !== undefined && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    
    const isSystemBypass = isValidInternalKey || isValidCronAuth;

    if (!isSystemBypass && (_token === undefined || _token === null || _token === '')) {
      const response = NextResponse.json(
        { _error: 'Authentication required', scope },
        { status: 401 }
      );
      return corsMiddleware(_request, response);
    }

    if (!isSystemBypass) {
      try {
        // In middleware, we just want to ensure it's a valid, unexpired _token with THE CORRECT AUDIENCE.
        const isAdmin = scope === 'admin' || scope === 'infrastructure';
        const _payload = await TokenService.verifyAccessToken(_token!, { isAdmin, audience: expectedAudience });

      // 4.2 Central RBAC Enforcement (P0-SEC-002)
      const isInfraRoute = pathname.startsWith('/api/admin') && portalIdentity === 'infrastructure';
      const isAdminRoute = (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth') && portalIdentity !== 'infrastructure') || 
                           pathname.startsWith('/api/factory') ||
                           pathname.startsWith('/api/analytics/admin');

      if (isInfraRoute) {
          const roles = Array.isArray(_payload.roles) ? (_payload.roles as string[]) : [];
          if (!roles.includes('INFRASTRUCTURE')) {
            return corsMiddleware(_request, NextResponse.json({ _error: 'Forbidden: Infrastructure privileges required' }, { status: 403 }));
          }
      } else if (isAdminRoute) {
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
