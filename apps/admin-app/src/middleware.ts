
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define specific cookie names used by the Admin context
  // The API server sets these when an admin logs in
  const hasAuth = 
    request.cookies.has('admin_accessToken') || 
    request.cookies.has('admin_refreshToken');

  // 2. Identify protected routes that need instant redirection
  // We want to protect the root / and all major management spokes
  const isProtectedRoute = 
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/questions') ||
    pathname.startsWith('/factory') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/governance') ||
    pathname.startsWith('/reports');

  // 3. SSR Redirect Logic:
  // If no auth cookie is present and the user is hitting a protected route,
  // redirect them to /login immediately.
  if (!hasAuth && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    
    // Optional: Preserve the original destination for post-login redirect
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public assets
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|login|forgot-password|reset-password).*)',
  ],
};
