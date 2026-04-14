import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? 'https://user.realtutorialhub.com/login';
const INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET;
const ONBOARDING_STATE_COOKIE = 'onboarding_state';

const PUBLIC_PATHS = ['/', '/login', '/forgot-password', '/reset-password', '/verify-email', '/verify-success', '/offline', '/placement', '/api/healthz'];
const PUBLIC_PREFIXES = ['/api/certificates/verify/'];
const PROTECTED_PREFIXES = ['/learn/', '/api/tutorial/', '/api/ai-tutor/', '/remediation/', '/dashboard'];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || hasPrefix(pathname, PUBLIC_PREFIXES);
}

export function isPublicAuthRoute(pathname: string): boolean {
  return pathname === '/api/auth' || pathname.startsWith('/api/auth/');
}

export function isProtectedRoute(pathname: string): boolean {
  return hasPrefix(pathname, PROTECTED_PREFIXES);
}

export function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('accessToken')?.value;
}

function hasCompletedOnboarding(request: NextRequest): boolean | null {
  const state = request.cookies.get(ONBOARDING_STATE_COOKIE)?.value;
  if (state === 'completed') return true;
  if (state === 'pending') return false;
  return null;
}

function getLoginUrl(request: NextRequest, redirectPath: string): URL {
  const host = request.headers.get('host') ?? request.nextUrl.hostname;
  const useLocalLogin = typeof host === 'string' && host.toLowerCase().includes('skillhubcore.in');
  const loginUrl =
    useLocalLogin
      ? new URL('/login', request.url)
      : LOGIN_URL.startsWith('http://') || LOGIN_URL.startsWith('https://')
      ? new URL(LOGIN_URL)
      : new URL(LOGIN_URL, request.url);
  loginUrl.searchParams.set('redirect', redirectPath);
  const brand = request.nextUrl.searchParams.get('brand');
  if (typeof brand === 'string' && brand.trim().length > 0) {
    loginUrl.searchParams.set('brand', brand.trim().toLowerCase());
  }
  return loginUrl;
}

function hasValidGatewaySecret(request: NextRequest): boolean {
  if (typeof INTERNAL_GATEWAY_SECRET !== 'string' || INTERNAL_GATEWAY_SECRET.length === 0) {
    return true;
  }

  return request.headers.get('x-gateway-secret') === INTERNAL_GATEWAY_SECRET;
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
  const isRSCRequest = request.nextUrl.searchParams.has('_rsc');

  if (isRSCRequest) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  
  // Allow healthz and root path without gateway secret for health checks
  if (pathname === '/api/healthz' || pathname === '/') {
    return NextResponse.next();
  }
  
  if (isPublicAuthRoute(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/') && hasValidGatewaySecret(request) === false && isPublicRoute(pathname) === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await resolveUser(request);
  const onboardingCompleted = hasCompletedOnboarding(request);
  const redirectPath = `${pathname}${search}`;

  if (user !== null && pathname === '/onboarding' && onboardingCompleted === true) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedRoute(pathname) && user === null) {
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  if (
    user !== null &&
    onboardingCompleted === false &&
    pathname !== '/onboarding' &&
    pathname.startsWith('/dashboard')
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
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
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
      missing: [
        { type: 'query', key: '_rsc' },
        { type: 'header', key: 'rsc' },
      ],
    },
  ],
};
