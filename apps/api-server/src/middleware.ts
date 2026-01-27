import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './modules/auth/rate-limit.middleware';
import { csrfProtection, setCsrfToken } from './modules/auth/csrf.middleware';
import { corsMiddleware } from './modules/auth/cors.middleware';
import { TokenService } from './modules/auth/token.service';

export async function middleware(request: NextRequest) {
  console.log('[MIDDLEWARE] Request:', request.method, request.nextUrl.pathname);
  
  // 1. CORS Preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return corsMiddleware(request, response);
  }

  // Only apply to /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Rate Limiting
  const rateLimitResponse = await rateLimit(request);
  if (rateLimitResponse) {
    return corsMiddleware(request, rateLimitResponse);
  }

  // 3. CSRF Protection for mutations
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth') || 
                      request.nextUrl.pathname.startsWith('/api/admin/auth');
  
  // Skip CSRF for auth routes (login/signup) which don't have tokens yet
  if (!isAuthRoute) {
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return corsMiddleware(request, csrfResponse);
    }
  }

  // 4. Auth Protection (Exclude public routes)
  // isAuthRoute already defined above
  const isPublicRoute = isAuthRoute || 
    request.nextUrl.pathname === '/api/status' || 
    request.nextUrl.pathname === '/api/migrate';

  if (!isPublicRoute) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
      return corsMiddleware(request, response);
    }

    const token = authHeader.split(' ')[1];
    try {
      // In middleware, we just want to ensure it's a valid, unexpired token.
      const payload = await TokenService.verifyAccessToken(token);
      console.log('[MIDDLEWARE] JWT Validated for user:', payload.userId);
    } catch (err: any) {
      console.error('[MIDDLEWARE] JWT Verification failed:', err.message);
      const response = NextResponse.json(
        { error: 'Invalid or expired token', message: err.message },
        { status: 401 }
      );
      return corsMiddleware(request, response);
    }
  }

  // Debug log after all checks pass
  console.log('[MIDDLEWARE] PASSED:', request.nextUrl.pathname);

  // 5. Proceed and add CORS headers
  const response = NextResponse.next();
  // Permanent Fix: Always re-issue/refresh CSRF token on successful requests
  // ensure the client always has a fresh token for the next mutation.
  setCsrfToken(response);
  return corsMiddleware(request, response);
}

export const config = {
  matcher: '/api/:path*',
};
