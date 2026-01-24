import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './modules/auth/rate-limit.middleware';
import { csrfProtection } from './modules/auth/csrf.middleware';
import { corsMiddleware } from './modules/auth/cors.middleware';

export async function proxy(request: NextRequest) {
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
  if (rateLimitResponse) return rateLimitResponse;

  // 3. CSRF Protection for mutations
  const csrfResponse = await csrfProtection(request);
  if (csrfResponse) return csrfResponse;

  // 4. Auth Protection (Exclude public routes)
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = isAuthRoute || request.nextUrl.pathname === '/api/status';

  if (!isPublicRoute) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  // 5. Proceed and add CORS headers
  const response = NextResponse.next();
  return corsMiddleware(request, response);
}

export const config = {
  matcher: '/api/:path*',
};
