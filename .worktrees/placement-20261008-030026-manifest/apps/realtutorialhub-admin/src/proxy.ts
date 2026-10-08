import { TokenService } from '@quiz/auth';
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
const REQUIRED_ROLES = ['admin', 'super_admin'];

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

type UserPayload = { sub: string; roles: string[]; shadowUserId: string; originalUserId: string };

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
  response.headers.set('x-user-roles', payload.roles.join(','));
  response.headers.set('x-user-primary-role', payload.roles[0] ?? 'student');
  return response;
}

async function resolveUser(request: NextRequest): Promise<UserPayload | null> {
  const token = getAccessToken(request);
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  try {
    const payload = await TokenService.verifyAdminAccessToken(token, { audience: 'admin' });
    const userIds = getTokenIds(payload);
    if (userIds === null) {
      return null;
    }

    return {
      sub: userIds.originalUserId,
      roles: payload.roles ?? [],
      shadowUserId: userIds.shadowUserId,
      originalUserId: userIds.originalUserId,
    };
  } catch {
    return null;
  }
}

function hasRequiredRole(payload: UserPayload): boolean {
  return payload.roles.some((role) => REQUIRED_ROLES.includes(role));
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
  const user = await resolveUser(request);
  const hasAdminAccessToken = user !== null;

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
    const headers = new Headers(request.headers);
    headers.set('x-user-id', user.shadowUserId);
    headers.set('x-shadow-user-id', user.shadowUserId);
    headers.set('x-original-user-id', user.originalUserId);
    headers.set('x-user-roles', user.roles.join(','));
    headers.set('x-user-primary-role', user.roles[0] ?? 'student');
    return addUserHeaders(NextResponse.next({ request: { headers } }), user);
  }

  if (isPublicRoute(pathname)) {
    return user !== null
      ? addUserHeaders(NextResponse.next({ request: { headers: new Headers(request.headers) } }), user)
      : NextResponse.next();
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

  if (user !== null && hasRequiredRole(user) === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (user === null) {
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  const headers = new Headers(request.headers);
  headers.set('x-user-id', user.shadowUserId);
  headers.set('x-shadow-user-id', user.shadowUserId);
  headers.set('x-original-user-id', user.originalUserId);
  headers.set('x-user-roles', user.roles.join(','));
  headers.set('x-user-primary-role', user.roles[0] ?? 'student');
  return addUserHeaders(NextResponse.next({ request: { headers } }), user);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
