
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Strict Auth Check
  // Check if cookies exist and have a non-empty value
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
    
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    
    const response = NextResponse.redirect(loginUrl);
    
    // 2. Cache-Control Hardening
    // Ensure browsers and CDNs don't cache the redirection response
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }

  const response = NextResponse.next();

  // Protect sensitive views from being cached by browsers/CDNs when logged in
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
