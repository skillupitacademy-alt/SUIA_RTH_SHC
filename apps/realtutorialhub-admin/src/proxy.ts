import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? '/login';
const INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET;

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
const ADMIN_ROLES = ['admin', 'super_admin'];

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
  // Admin portal uses 'admin_accessToken' cookie; fallback to 'accessToken' for compatibility
  return request.cookies.get('admin_accessToken')?.value ?? request.cookies.get('accessToken')?.value;
}

function getLoginUrl(request: NextRequest, redirectPath: string): URL {
  const loginUrl =
    LOGIN_URL.startsWith('http://') || LOGIN_URL.startsWith('https://')
      ? new URL(LOGIN_URL)
      : new URL(LOGIN_URL, request.url);
  loginUrl.searchParams.set('redirect', redirectPath);
  return loginUrl;
}

function hasValidGatewaySecret(request: NextRequest): boolean {
  if (typeof INTERNAL_GATEWAY_SECRET !== 'string' || INTERNAL_GATEWAY_SECRET.length === 0) {
    return true;
  }

  return request.headers.get('x-gateway-secret') === INTERNAL_GATEWAY_SECRET;
}

function getUnauthorizedUrl(request: NextRequest): URL {
  return new URL('/unauthorized', request.url);
}

type UserPayload = { sub: string; roles: string[] };

type VerifiedTokenPayload = {
  sub?: string;
  userId?: string;
  roles?: string[];
};

function getTokenUserId(payload: VerifiedTokenPayload): string | null {
  return payload.sub ?? payload.userId ?? null;
}

function addUserHeaders(response: NextResponse, payload: UserPayload): NextResponse {
  response.headers.set('x-user-id', payload.sub);
  return response;
}

async function resolveUser(request: NextRequest): Promise<UserPayload | null> {
  const token = getAccessToken(request);
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  try {
    const payload = await TokenService.verifyAdminAccessToken(token, { audience: 'admin' });
    const userId = getTokenUserId(payload);
    if (userId === null) {
      return null;
    }
    return { sub: userId, roles: payload.roles ?? [] };
  } catch {
    // Fallback: try verifying as a user token (admin may use user tokens on some routes)
    try {
      const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
      const userId = getTokenUserId(payload);
      if (userId === null) {
        return null;
      }
      return { sub: userId, roles: payload.roles ?? [] };
    } catch {
      return null;
    }
  }
}

function hasAdminRole(payload: UserPayload): boolean {
  return payload.roles.some((role) => ADMIN_ROLES.includes(role.toLowerCase()));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') ?? 'no-request-id';
  if (hasValidGatewaySecret(request) === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await resolveUser(request);
  const redirectPath = `${pathname}${search}`;
  const accessToken = getAccessToken(request);
  const hasAccessToken = typeof accessToken === 'string' && accessToken.trim().length > 0;

  if (pathname === '/login' || pathname === '/dashboard' || isProtectedRoute(pathname)) {
    console.log('[AUTH_FLOW][ADMIN_PROXY][CHECK]', JSON.stringify({
      requestId,
      path: pathname,
      search,
      hasAccessToken,
      isProtected: isProtectedRoute(pathname),
      hasUser: user !== null,
    }));
  }

  if (isPublicRoute(pathname)) {
    if (user !== null) {
      const headers = new Headers(request.headers);
      headers.set('x-user-id', user.sub);
      return addUserHeaders(NextResponse.next({ request: { headers } }), user);
    }

    return NextResponse.next();
  }

  if (isProtectedRoute(pathname) && user === null) {
    console.log('[AUTH_FLOW][ADMIN_PROXY][REDIRECT_TO_LOGIN]', JSON.stringify({
      requestId,
      path: pathname,
      redirectPath,
      reason: 'missing_or_invalid_access_token',
      hasAccessToken,
    }));
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  if (user !== null && isProtectedRoute(pathname) && hasAdminRole(user) === false) {
    console.log('[AUTH_FLOW][ADMIN_PROXY][REDIRECT_TO_UNAUTHORIZED]', JSON.stringify({
      requestId,
      path: pathname,
      redirectPath,
      reason: 'insufficient_role',
      roles: user.roles,
    }));
    return NextResponse.redirect(getUnauthorizedUrl(request));
  }

  if (user !== null) {
    const headers = new Headers(request.headers);
    headers.set('x-user-id', user.sub);
    return addUserHeaders(NextResponse.next({ request: { headers } }), user);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
