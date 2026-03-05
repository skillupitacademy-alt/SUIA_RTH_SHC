
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  // Auth check
  const accessToken = request.cookies.get('accessToken')?.value;
  const hasAuth = accessToken !== undefined && accessToken.split('.').length === 3;

  const isProtectedRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/onboarding') ||
    path.startsWith('/exam') ||
    path.startsWith('/reports') ||
    path.startsWith('/quiz') ||
    path.startsWith('/profile');

  const isAuthRoute = 
    path.startsWith('/login') || 
    path.startsWith('/signup') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password');

  // 1. Redirect unauthenticated users from protected routes
  if (!hasAuth && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // 2. Redirect authenticated users from auth routes
  if (hasAuth && isAuthRoute) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  // Security headers for all responses
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
