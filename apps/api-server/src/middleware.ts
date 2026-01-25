import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './modules/auth/rate-limit.middleware';
import { csrfProtection } from './modules/auth/csrf.middleware';
import { corsMiddleware } from './modules/auth/cors.middleware';

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
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');
  
  // Skip CSRF for auth routes (login/signup) which don't have tokens yet
  if (!isAuthRoute) {
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return corsMiddleware(request, csrfResponse);
    }
  }

  // 4. Auth Protection (Exclude public routes)
  // isAuthRoute already defined above
  const isPublicRoute = isAuthRoute || request.nextUrl.pathname === '/api/status' || request.nextUrl.pathname === '/api/migrate';

  if (!isPublicRoute) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
      return corsMiddleware(request, response);
    }
  }

  // 5. Proceed and add CORS headers
  const response = NextResponse.next();
  return corsMiddleware(request, response);
}

export const config = {
  matcher: '/api/:path*',
};
