import { NextRequest, NextResponse } from 'next/server';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? '/login';

const PUBLIC_PATHS = ['/api/healthz', '/login', '/forgot-password', '/reset-password', '/unauthorized', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/me'];
const PROTECTED_PREFIXES = [
  '/dashboard/',
  '/dashboard',
  '/questions/',
  '/questions',
  '/factory/',
  '/factory',
  '/users/',
  '/users',
  '/governance/',
  '/governance',
  '/reports/',
  '/reports',
  '/',
];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export function isProtectedRoute(pathname: string): boolean {
  return hasPrefix(pathname, PROTECTED_PREFIXES) && pathname !== '/api/healthz';
}

export function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('admin_accessToken')?.value;
}

function getLoginUrl(request: NextRequest, redirectPath: string): URL {
  const loginUrl =
    LOGIN_URL.startsWith('http://') || LOGIN_URL.startsWith('https://')
      ? new URL(LOGIN_URL)
      : new URL(LOGIN_URL, request.url);
  loginUrl.searchParams.set('redirect', redirectPath);
  return loginUrl;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') ?? 'no-request-id';
  const redirectPath = `${pathname}${search}`;
  const adminAccessToken = getAccessToken(request);
  const hasAdminAccessToken = typeof adminAccessToken === 'string' && adminAccessToken.trim().length > 0;

  if (pathname === '/' || pathname === '/login' || pathname === '/dashboard' || isProtectedRoute(pathname)) {
    console.log('[AUTH_FLOW][ADMIN_PROXY][CHECK]', JSON.stringify({
      requestId,
      path: pathname,
      search,
      hasAdminAccessToken,
      isProtected: isProtectedRoute(pathname),
    }));
  }

  if (pathname === '/') {
    if (hasAdminAccessToken === false) {
      return NextResponse.redirect(getLoginUrl(request, redirectPath));
    }
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(pathname) && hasAdminAccessToken === false) {
    console.log('[AUTH_FLOW][ADMIN_PROXY][REDIRECT_TO_LOGIN]', JSON.stringify({
      requestId,
      path: pathname,
      redirectPath,
      reason: 'missing_admin_access_token',
      hasAdminAccessToken,
    }));
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
