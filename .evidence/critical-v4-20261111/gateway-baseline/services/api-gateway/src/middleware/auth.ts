import { TokenService } from '@quiz/auth';

import type { GatewayBindings } from '@/types';
import type { SkillHubCoreTokenPayload } from '@/types';
import type { Brand } from '@/lib/brand-resolution';

export type PortalKind = 'admin' | 'user';
export type AuthTokenSource = 'admin_accessToken' | 'accessToken' | 'authorization';

type RouteLike = {
  requireRole?: 'admin';
  upstreamKey?: string;
  prefix?: string;
  host?: string;
};

export type AuthResolution = {
  payload: SkillHubCoreTokenPayload;
  portal: PortalKind;
  tokenSource: AuthTokenSource;
  requestBrand: Brand;
};

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const match = cookieHeader.match(pattern);
  return match?.[1] !== undefined ? decodeURIComponent(match[1]) : undefined;
}

/**
 * @deprecated Use resolveTrustedRequestBrand() from @/lib/request-brand instead.
 * This function is kept for backward compatibility but should not be used directly.
 */
export function detectRequestBrand(request: Request): string | undefined {
  const explicitBrand =
    normalizeString(request.headers.get('x-brand')) ??
    normalizeString(request.headers.get('x-platform'));

  if (explicitBrand === 'realtutorialhub' || explicitBrand === 'skillup') {
    return explicitBrand;
  }

  return undefined;
}

/**
 * @deprecated Removed. Use canonical resolveBrandFromHostname() from @/lib/brand-resolution instead.
 * This function had unsafe substring matching and silent RTH fallback.
 */
export function resolveBrandFromHostname(): 'realtutorialhub' | 'skillup' {
  throw new Error(
    'resolveBrandFromHostname() from auth.ts is deprecated. ' +
    'Use resolveBrandFromHostname() from @/lib/brand-resolution and ' +
    'resolveTrustedRequestBrand() from @/lib/request-brand instead.'
  );
}

export function detectRequestPortal(request: Request, route?: RouteLike): PortalKind {
  const requestedPortal = normalizeString(request.headers.get('x-portal-identity'));

  if (route?.requireRole === 'admin' || route?.prefix === '/admin') {
    return 'admin';
  }

  if (requestedPortal === 'admin') {
    return 'admin';
  }

  return 'user';
}

function getTokenFromHeaders(request: Request, portal: PortalKind): { token?: string; source?: AuthTokenSource } {
  // 🔥 CRITICAL FIX: Check cookie FIRST, then Authorization header (consistent with API server)
  const cookieHeader = request.headers.get('cookie') ?? '';
  
  if (portal === 'admin') {
    const adminAccessToken = getCookieValue(cookieHeader, 'admin_accessToken');
    if (adminAccessToken !== undefined) {
      return { token: adminAccessToken, source: 'admin_accessToken' };
    }
  } else {
    const accessToken = getCookieValue(cookieHeader, 'accessToken');
    if (accessToken !== undefined) {
      return { token: accessToken, source: 'accessToken' };
    }
  }

  // Fallback to Authorization header
  const authorization = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    const bearerToken = authorization.slice(7).trim();
    if (bearerToken.length > 0) {
      return { token: bearerToken, source: 'authorization' };
    }
  }

  return {};
}

export function hasRequiredRole(payload: SkillHubCoreTokenPayload, requiredRole: 'admin'): boolean {
  const roles = normalizeRoles(payload);
  return roles.includes(requiredRole) || roles.includes('super_admin');
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().toLowerCase() : undefined;
}

/**
 * 🔥 UNIFIED ROLE NORMALIZATION (STRICT MODE)
 * 
 * RULES:
 * 1. ALWAYS return array (never undefined)
 * 2. ALWAYS lowercase
 * 3. ALWAYS deduplicate
 * 4. ❌ NO FALLBACK to ['user'] - empty roles = denial
 * 5. Support legacy 'role' field for backward compatibility
 */
function normalizeRoles(payload: Partial<SkillHubCoreTokenPayload> & { role?: unknown }): string[] {
  const rawRoles = Array.isArray(payload.roles)
    ? payload.roles
    : typeof payload.role === 'string'
      ? [payload.role]
      : [];

  const roles = rawRoles
    .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
    .map((role) => role.trim().toLowerCase());

  // 🔥 CRITICAL FIX: NO FALLBACK - empty roles should be handled by RBAC
  // If JWT has no roles, that's a token generation bug, not a normalization issue
  return Array.from(new Set(roles));
}

export async function authenticateRequest(
  request: Request,
  env: GatewayBindings,
  route?: RouteLike,
  resolvedBrand?: Brand,
): Promise<AuthResolution | Response> {
  const portal = detectRequestPortal(request, route);
  
  // Brand must be resolved by caller using resolveTrustedRequestBrand()
  if (!resolvedBrand) {
    console.log('[CF_AUTH_REJECT] No brand resolved - returning 400');
    return new Response(JSON.stringify({ 
      error: 'Bad Request', 
      reason: 'brand_unresolved',
      message: 'Unable to resolve brand from request hostname'
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  
  const selection = getTokenFromHeaders(request, portal);
  const token = selection.token;

  // 🔥 CRITICAL DEBUG: Log token extraction
  console.log('[CF_AUTH_DEBUG]', JSON.stringify({
    portal,
    resolvedBrand,
    hasCookie: request.headers.get('cookie') !== null,
    hasAuthHeader: request.headers.get('authorization') !== null,
    tokenSource: selection.source ?? null,
    tokenFound: token !== undefined && token.length > 0,
  }));

  if (token === undefined || token.trim().length === 0) {
    console.log('[CF_AUTH_REJECT] No token found - returning 401');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const tokenService = new TokenService(
      new TextEncoder().encode(env.JWT_SECRET),
      new TextEncoder().encode(env.JWT_SECRET),
      new TextEncoder().encode(env.ADMIN_JWT_SECRET ?? env.JWT_SECRET),
    );
    const verifiedPayload = portal === 'admin'
      ? await tokenService.verifyAccessToken(token)
      : await tokenService.verifyUserAccessToken(token, { audience: 'user' });

    const shadowUserId = normalizeString(verifiedPayload.shadowUserId);
    const originalUserId = normalizeString(verifiedPayload.originalUserId);

    if (shadowUserId === undefined || originalUserId === undefined) {
      console.log('[CF_AUTH_REJECT] Missing identity claims - returning 401');
      throw new Error('Invalid token payload: missing shadow or original user id');
    }

    const payload = {
      ...(verifiedPayload as unknown as SkillHubCoreTokenPayload),
      sub: shadowUserId,
      shadowUserId,
      originalUserId,
      roles: normalizeRoles(verifiedPayload as Partial<SkillHubCoreTokenPayload> & { role?: unknown }),
    } satisfies SkillHubCoreTokenPayload;

    const tokenType = normalizeString(payload.tokenType);
    const expectedTokenType = portal === 'admin' ? 'admin' : 'user';
    
    // 🔥 CRITICAL DEBUG: Log tokenType validation
    console.log('[CF_AUTH_TOKEN_TYPE]', JSON.stringify({
      tokenType: tokenType ?? null,
      expectedTokenType,
      match: tokenType === expectedTokenType,
    }));
    
    if (tokenType === undefined || tokenType !== expectedTokenType) {
      console.log('[CF_AUTH_REJECT] Token type mismatch - returning 403');
      return new Response(JSON.stringify({ error: 'Forbidden', reason: 'token_type_mismatch' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    const tokenBrand = normalizeString(payload.brand);
    
    // 🔥 CRITICAL DEBUG: Log brand validation
    console.log('[CF_AUTH_BRAND]', JSON.stringify({
      tokenBrand: tokenBrand ?? null,
      resolvedBrand,
      match: tokenBrand === resolvedBrand,
    }));
    
    // 🔥 CRITICAL FIX: Validate JWT brand matches the resolved trusted brand
    if (tokenBrand !== undefined && tokenBrand !== resolvedBrand) {
      console.log('[CF_AUTH_REJECT] Brand mismatch - returning 403');
      return new Response(JSON.stringify({ error: 'Forbidden', reason: 'brand_mismatch' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (portal === 'admin' && hasRequiredRole(payload, 'admin') === false) {
      console.log('[CF_AUTH_REJECT] Missing admin role - returning 403');
      return new Response(JSON.stringify({ error: 'Forbidden', reason: 'missing_admin_role' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    console.log('[CF_AUTH_SUCCESS]', JSON.stringify({
      portal,
      tokenSource: selection.source ?? 'authorization',
      tokenType,
      tokenBrand: tokenBrand ?? null,
      resolvedBrand,
    }));

    return {
      payload,
      portal,
      tokenSource: selection.source ?? 'authorization',
      requestBrand: resolvedBrand,
    };
  } catch (error) {
    console.log('[CF_AUTH_REJECT] Token verification failed - returning 401', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
}
