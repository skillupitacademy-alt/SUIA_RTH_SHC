import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET;
const ONBOARDING_STATE_COOKIE = 'onboarding_state';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-success',
  '/offline',
  '/placement',
  '/api/healthz',
  '/programs',
  '/learning-path',
];

const PUBLIC_PREFIXES = ['/verify', '/api/programs', '/api/certificates/verify/'];

const PROTECTED_PREFIXES = [
  '/learn/',
  '/start-learning/',
  '/api/tutorial/',
  '/api/ai-tutor/',
  '/remediation/',
  '/dashboard',
  '/onboarding',
  '/student',
  '/batches',
  '/faculty',
  '/api/student',
  '/api/batches',
];

// 🔥 CRITICAL FIX: All roles must be lowercase to prevent security bypass
const OVERRIDE_ROLES = ['admin', 'super_admin', 'faculty'];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => {
    // Handle exact matches and prefix matches
    if (prefix.endsWith('/')) {
      // For prefixes ending with '/', match if pathname starts with the prefix
      return pathname.startsWith(prefix);
    } else {
      // For prefixes not ending with '/', match exact path or path with trailing slash
      return pathname === prefix || pathname.startsWith(prefix + '/');
    }
  });
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

function isLocalSubtopicPreviewRoute(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname;
  return (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    request.nextUrl.pathname.startsWith('/start-learning/subtopic/')
  );
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

function getLoginUrl(request: NextRequest, redirectPath: string, brandLoginUrl?: string): URL {
  // Use brand-specific login URL if provided, otherwise construct from current host
  const loginUrl = brandLoginUrl
    ? brandLoginUrl.startsWith('http://') || brandLoginUrl.startsWith('https://')
      ? new URL(brandLoginUrl)
      : new URL(brandLoginUrl, request.url)
    : new URL('/login', request.url);
    
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

  const gatewaySecret = request.headers.get('x-gateway-secret');
  
  // 🔥 CRITICAL DEBUG: Log gateway secret validation
  console.log('[BFF_GATEWAY_SECRET]', JSON.stringify({
    hasSecret: gatewaySecret !== null,
    secretLength: gatewaySecret?.length ?? 0,
    expectedLength: INTERNAL_GATEWAY_SECRET.length,
    match: gatewaySecret === INTERNAL_GATEWAY_SECRET,
    pathname: request.nextUrl.pathname,
  }));

  return gatewaySecret === INTERNAL_GATEWAY_SECRET;
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
  
  console.log('[BFF_AUTH_DEBUG]', JSON.stringify({
    pathname: request.nextUrl.pathname,
    hasToken: token !== undefined && token.trim().length > 0,
    tokenLength: token?.length ?? 0,
    tokenPrefix: token?.substring(0, 20),
  }));
  
  if (token === undefined || token.trim().length === 0) {
    console.log('[BFF_AUTH_DEBUG] No token found');
    return null;
  }

  try {
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
    const userIds = getTokenIds(payload);
    if (userIds === null) {
      console.log('[BFF_AUTH_DEBUG] Invalid user IDs in token');
      return null;
    }
    
    console.log('[BFF_AUTH_DEBUG] Token verified successfully', JSON.stringify({
      userId: userIds.shadowUserId.substring(0, 8),
      roles: payload.roles,
    }));
    
    return {
      sub: userIds.shadowUserId,
      roles: payload.roles ?? [],
      shadowUserId: userIds.shadowUserId,
      originalUserId: userIds.originalUserId,
    };
  } catch (error) {
    console.log('[BFF_AUTH_DEBUG] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

function hasRequiredRole(payload: UserPayload): boolean {
  // 🔥 CRITICAL: Roles are already normalized in unifiedBffAuth.ts
  // DO NOT re-normalize here to avoid inconsistency
  const roles = payload.roles; // already normalized
  
  return roles.includes('student') || 
         roles.includes('user') || 
         roles.some((role) => OVERRIDE_ROLES.includes(role));
}

export interface AuthProxyOptions {
  brandLoginUrl?: string;
}

export async function createAuthProxy(options: AuthProxyOptions = {}) {
  return async function authProxy(request: NextRequest) {
    const isRSCRequest = request.nextUrl.searchParams.has('_rsc');

    if (isRSCRequest) {
      return NextResponse.next();
    }

    const { pathname, search } = request.nextUrl;
    const user = await resolveUser(request);
    const onboardingCompleted = hasCompletedOnboarding(request);
    const redirectPath = `${pathname}${search}`;
    const isApiRoute = pathname.startsWith('/api/');

    // Allow healthz and root path without gateway secret for health checks
    if (pathname === '/api/healthz' || pathname === '/') {
      return NextResponse.next();
    }
    
    if (isPublicAuthRoute(pathname)) {
      return NextResponse.next();
    }

    if (isPublicRoute(pathname)) {
      return user !== null
        ? addUserHeaders(NextResponse.next({ request: { headers: new Headers(request.headers) } }), user)
        : NextResponse.next();
    }

    // 🔥 CRITICAL: BFF's own API routes should NOT require gateway secret
    // Only external API calls (through gateway) need gateway secret
    // BFF internal routes like /api/profile, /api/auth/* are internal service calls
    const isBffInternalRoute = pathname.startsWith('/api/') && (
      pathname.startsWith('/api/auth/') ||
      pathname.startsWith('/api/profile') ||
      pathname.startsWith('/api/user/') ||
      pathname.startsWith('/api/dashboard/') ||
      pathname.startsWith('/api/onboarding/') ||
      pathname.startsWith('/api/quiz/') ||
      pathname.startsWith('/api/tutorial/sections/')
    );
    
    if (isApiRoute && !isBffInternalRoute && hasValidGatewaySecret(request) === false && isPublicRoute(pathname) === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle authenticated user accessing onboarding when already completed
    if (user !== null && pathname === '/onboarding' && onboardingCompleted === true) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Handle unauthenticated user accessing protected routes
    if (isProtectedRoute(pathname) && user === null && !isLocalSubtopicPreviewRoute(request)) {
      return isApiRoute
        ? NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        : NextResponse.redirect(getLoginUrl(request, redirectPath, options.brandLoginUrl));
    }

    // Handle authenticated user who hasn't completed onboarding
    if (
      user !== null &&
      onboardingCompleted === false &&
      pathname !== '/onboarding' &&
      pathname.startsWith('/dashboard')
    ) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Handle protected routes with authenticated user
    if (isProtectedRoute(pathname)) {
      if (user !== null && hasRequiredRole(user) === false) {
        if (isApiRoute) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const response = NextResponse.redirect(getLoginUrl(request, redirectPath, options.brandLoginUrl));
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        return response;
      }

      const headers = new Headers(request.headers);
      if (user !== null) {
        headers.set('x-user-id', user.shadowUserId);
        headers.set('x-shadow-user-id', user.shadowUserId);
        headers.set('x-original-user-id', user.originalUserId);
      }

      return user !== null
        ? addUserHeaders(NextResponse.next({ request: { headers } }), user)
        : NextResponse.next({ request: { headers } });
    }

    return NextResponse.next();
  };
}
