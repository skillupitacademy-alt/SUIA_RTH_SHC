import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveBrandFromHostname,
  extractHostnameFromRequest,
  type Brand,
} from '../auth/brandResolution';

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
  '/tutorial-v2',
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

type UserPayload = {
  sub: string;
  roles: string[];
  shadowUserId: string;
  originalUserId: string;
  brand?: Brand;
};

type AuthResult = 
  | { type: 'authenticated'; user: UserPayload }
  | { type: 'unauthenticated' }
  | { type: 'forbidden'; reason: 'brand_mismatch' | 'brand_unresolved' };

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

async function resolveUser(request: NextRequest): Promise<AuthResult> {
  const token = getAccessToken(request);
  
  console.log('[BFF_AUTH_DEBUG]', JSON.stringify({
    pathname: request.nextUrl.pathname,
    hasToken: token !== undefined && token.trim().length > 0,
    tokenLength: token?.length ?? 0,
    tokenPrefix: token?.substring(0, 20),
  }));
  
  if (token === undefined || token.trim().length === 0) {
    console.log('[BFF_AUTH_DEBUG] No token found');
    return { type: 'unauthenticated' };
  }

  try {
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
    const userIds = getTokenIds(payload);
    if (userIds === null) {
      console.log('[BFF_AUTH_DEBUG] Invalid user IDs in token');
      return { type: 'unauthenticated' };
    }

    // 🔒 SECURITY: Extract JWT brand claim
    const jwtBrand = typeof payload.brand === 'string' ? payload.brand.trim().toLowerCase() : undefined;
    
    // 🔒 SECURITY: Resolve trusted request brand from hostname
    const hostHeader = request.headers.get('host');
    const hostname = extractHostnameFromRequest(hostHeader);
    const requestBrand = hostname ? resolveBrandFromHostname(hostname) : undefined;

    console.log('[BFF_BRAND_VALIDATION]', JSON.stringify({
      pathname: request.nextUrl.pathname,
      hostHeader,
      hostname,
      jwtBrand: jwtBrand ?? null,
      requestBrand: requestBrand ?? null,
      match: jwtBrand === requestBrand,
    }));

    // 🔒 SECURITY: Reject if request brand cannot be resolved
    // This prevents ambiguous tenant context
    if (!requestBrand) {
      console.log('[BFF_AUTH_REJECT] Cannot resolve request brand', JSON.stringify({
        pathname: request.nextUrl.pathname,
        hostHeader,
        hostname,
      }));
      return { type: 'forbidden', reason: 'brand_unresolved' };
    }

    // 🔒 SECURITY: Reject if JWT brand claim is missing
    // All user JWTs must explicitly identify their authorized brand
    if (!jwtBrand) {
      console.log('[BFF_AUTH_REJECT] JWT missing brand claim', JSON.stringify({
        pathname: request.nextUrl.pathname,
        requestBrand,
        userId: userIds.shadowUserId.substring(0, 8),
      }));
      return { type: 'forbidden', reason: 'brand_mismatch' };
    }

    // 🔒 SECURITY: Enforce brand boundary
    // JWT brand must match the trusted request brand
    if (jwtBrand !== requestBrand) {
      console.log('[BFF_AUTH_REJECT] Brand mismatch', JSON.stringify({
        pathname: request.nextUrl.pathname,
        jwtBrand,
        requestBrand,
        userId: userIds.shadowUserId.substring(0, 8),
      }));
      return { type: 'forbidden', reason: 'brand_mismatch' };
    }
    
    console.log('[BFF_AUTH_DEBUG] Token verified successfully', JSON.stringify({
      userId: userIds.shadowUserId.substring(0, 8),
      roles: payload.roles,
      brand: requestBrand,
    }));
    
    return {
      type: 'authenticated',
      user: {
        sub: userIds.shadowUserId,
        roles: payload.roles ?? [],
        shadowUserId: userIds.shadowUserId,
        originalUserId: userIds.originalUserId,
        brand: requestBrand,
      },
    };
  } catch (error) {
    console.log('[BFF_AUTH_DEBUG] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return { type: 'unauthenticated' };
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
    // 🔒 SECURITY: RSC requests MUST NOT bypass authentication
    // RSC is a transport/rendering mechanism, not an authorization class
    // Protected routes must be authenticated regardless of request type (HTML/RSC/API)
    
    const { pathname, search } = request.nextUrl;
    const authResult = await resolveUser(request);
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
      return authResult.type === 'authenticated'
        ? addUserHeaders(NextResponse.next({ request: { headers: new Headers(request.headers) } }), authResult.user)
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

    // 🔒 SECURITY: Return 403 for brand mismatch or unresolved brand
    if (authResult.type === 'forbidden') {
      console.log('[BFF_AUTH_FORBIDDEN]', JSON.stringify({
        pathname,
        reason: authResult.reason,
      }));
      
      if (isApiRoute) {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            reason: authResult.reason,
            message: authResult.reason === 'brand_mismatch' 
              ? 'Access denied: brand authorization failed'
              : 'Access denied: unable to resolve request brand'
          },
          { status: 403 },
        );
      }
      
      // For non-API routes, also return 403 (don't redirect to login for wrong brand)
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Handle authenticated user accessing onboarding when already completed
    if (authResult.type === 'authenticated' && pathname === '/onboarding' && onboardingCompleted === true) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Handle unauthenticated user accessing protected routes
    if (isProtectedRoute(pathname) && authResult.type === 'unauthenticated') {
      return isApiRoute
        ? NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        : NextResponse.redirect(getLoginUrl(request, redirectPath, options.brandLoginUrl));
    }

    // Handle authenticated user who hasn't completed onboarding
    if (
      authResult.type === 'authenticated' &&
      onboardingCompleted === false &&
      pathname !== '/onboarding' &&
      pathname.startsWith('/dashboard')
    ) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Handle protected routes with authenticated user
    if (isProtectedRoute(pathname)) {
      if (authResult.type !== 'authenticated') {
        if (isApiRoute) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 },
          );
        }

        return NextResponse.redirect(
          getLoginUrl(request, redirectPath, options.brandLoginUrl),
        );
      }

      if (hasRequiredRole(authResult.user) === false) {
        if (isApiRoute) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 },
          );
        }

        const response = NextResponse.redirect(
          getLoginUrl(request, redirectPath, options.brandLoginUrl),
        );

        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');

        return response;
      }

      const headers = new Headers(request.headers);

      headers.set('x-user-id', authResult.user.shadowUserId);
      headers.set('x-shadow-user-id', authResult.user.shadowUserId);
      headers.set('x-original-user-id', authResult.user.originalUserId);

      if (pathname.startsWith('/tutorial-v2')) {
        console.log(
          '[TUTORIAL_AUTH_HEADERS]',
          JSON.stringify({
            pathname,
            authenticated: true,
            hasUserId: headers.has('x-user-id'),
            hasShadowUserId: headers.has('x-shadow-user-id'),
            hasOriginalUserId: headers.has('x-original-user-id'),
            roles: authResult.user.roles,
            brand: authResult.user.brand,
          }),
        );
      }

      return NextResponse.next({
        request: {
          headers,
        },
      });
    }

    return NextResponse.next();
  };
}
