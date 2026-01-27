
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protected Routes
  if (path.startsWith('/dashboard') || path.startsWith('/onboarding')) {
    // We can't access localStorage here, and cookie 'accessToken' isn't set yet.
    // Since domains differ (quiz. vs api. subdomains), we rely on client-side check.
    // However, if we eventually proxy /api, we can check cookies.
    
    // Fallback: Just proceed and let Layout/Context handle redirect.
    // For now, return next() to allow client component to load and check auth.
    return NextResponse.next();
    
    /* 
    // Future implementation if we proxy or same-domain:
    const token = request.cookies.get('refreshToken');
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    */
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
};
