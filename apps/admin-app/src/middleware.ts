
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  // 1. Strict Auth Check
  const accessToken = request.cookies.get('admin_accessToken')?.value;
  const refreshToken = request.cookies.get('admin_refreshToken')?.value;
  const hasAuth = (accessToken !== undefined && accessToken.length > 0) || (refreshToken !== undefined && refreshToken.length > 0);

  const isProtectedRoute = 
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/questions') ||
    pathname.startsWith('/factory') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/governance') ||
    pathname.startsWith('/reports');

  if (hasAuth === false && isProtectedRoute === true) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('redirect', pathname);
    
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  if (isProtectedRoute === true) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|login|forgot-password|reset-password).*)',
  ],
};
