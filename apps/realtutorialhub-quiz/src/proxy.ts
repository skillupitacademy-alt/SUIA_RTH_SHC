import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? '/login';

const PUBLIC_PATHS = ['/', '/api/healthz', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/me'];
const PROTECTED_PREFIXES = ['/dashboard/', '/dashboard', '/exam/', '/exam', '/onboarding/', '/onboarding', '/reports/', '/reports', '/quiz/', '/quiz', '/profile/', '/profile'];
const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export function isProtectedRoute(pathname: string): boolean {
  return hasPrefix(pathname, PROTECTED_PREFIXES) && pathname !== '/api/healthz';
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_PATHS.includes(pathname);
}

export function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('accessToken')?.value;
}

function getLoginUrl(request: NextRequest, redirectPath: string): URL {
  const loginUrl =
    LOGIN_URL.startsWith('http://') || LOGIN_URL.startsWith('https://')
      ? new URL(LOGIN_URL)
      : new URL(LOGIN_URL, request.url);
  loginUrl.searchParams.set('redirect', redirectPath);
  const brand = request.nextUrl.searchParams.get('brand');
  if (typeof brand === 'string' && brand.trim().length > 0) {
    loginUrl.searchParams.set('brand', brand.trim().toLowerCase());
  }
  return loginUrl;
}

type UserPayload = { sub: string; roles?: string[]; shadowUserId: string; originalUserId: string };

type VerifiedTokenPayload = {
  sub?: string;
  userId?: string;
  originalUserId?: string;
  shadowUserId?: string;
  roles?: string[];
};

function getTokenIds(payload: VerifiedTokenPayload): { originalUserId: string; shadowUserId: string } | null {
  const originalUserId = payload.originalUserId ?? null;
  if (originalUserId === null || originalUserId.trim().length === 0) {
    return null;
  }

  const shadowUserId = payload.shadowUserId ?? null;
  if (shadowUserId === null || shadowUserId.trim().length === 0) {
    return null;
  }
  return { originalUserId, shadowUserId };
}

function addUserHeaders(response: NextResponse, payload: UserPayload): NextResponse {
  response.headers.set('x-user-id', payload.shadowUserId);
  response.headers.set('x-shadow-user-id', payload.shadowUserId);
  response.headers.set('x-original-user-id', payload.originalUserId);
  return response;
}

async function resolveUser(request: NextRequest): Promise<UserPayload | null> {
  const token = getAccessToken(request);
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  try {
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
    const userIds = getTokenIds(payload);
    if (userIds === null) {
      return null;
    }
    return {
      sub: userIds.shadowUserId,
      roles: payload.roles ?? [],
      shadowUserId: userIds.shadowUserId,
      originalUserId: userIds.originalUserId,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') ?? 'no-request-id';
  const accessToken = getAccessToken(request);
  const user = await resolveUser(request);
  const redirectPath = `${pathname}${search}`;
  const hasAccessToken = typeof accessToken === 'string' && accessToken.trim().length > 0;

  if (pathname === '/login' || pathname === '/dashboard' || isProtectedRoute(pathname)) {
    console.log('[AUTH_FLOW][QUIZ_PROXY][CHECK]', JSON.stringify({
      requestId,
      path: pathname,
      search,
      hasAccessToken,
      isProtected: isProtectedRoute(pathname),
      hasUser: user !== null,
    }));
  }

  if (isProtectedRoute(pathname) && user === null) {
    console.log('[AUTH_FLOW][QUIZ_PROXY][REDIRECT_TO_LOGIN]', JSON.stringify({
      requestId,
      path: pathname,
      redirectPath,
      reason: 'missing_or_invalid_access_token',
      hasAccessToken,
    }));
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  if (user !== null && isAuthRoute(pathname)) {
    console.log('[AUTH_FLOW][QUIZ_PROXY][REDIRECT_TO_DASHBOARD]', JSON.stringify({
      requestId,
      path: pathname,
      reason: 'authenticated_on_auth_route',
    }));
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (user !== null) {
    const headers = new Headers(request.headers);
    headers.set('x-user-id', user.shadowUserId);
    headers.set('x-shadow-user-id', user.shadowUserId);
    headers.set('x-original-user-id', user.originalUserId);
    return addUserHeaders(NextResponse.next({ request: { headers } }), user);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
