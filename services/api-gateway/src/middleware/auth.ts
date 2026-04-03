import { jwtVerify } from 'jose';

import type { GatewayBindings } from '@/types';
import type { SkillHubCoreTokenPayload } from '@/types';

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
  requestBrand?: string;
};

type JwtPayloadWithLegacyClaims = {
  userId?: unknown;
  subscriptions?: unknown;
  tokenType?: unknown;
  role?: unknown;
  brand?: unknown;
};

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const match = cookieHeader.match(pattern);
  return match?.[1] !== undefined ? decodeURIComponent(match[1]) : undefined;
}

export function detectRequestBrand(request: Request): string | undefined {
  const explicitBrand =
    normalizeString(request.headers.get('x-brand')) ??
    normalizeString(request.headers.get('x-platform'));

  if (explicitBrand === 'realtutorialhub' || explicitBrand === 'skillup') {
    return explicitBrand;
  }

  return undefined;
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
  const authorization = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    const bearerToken = authorization.slice(7).trim();
    if (bearerToken.length > 0) {
      return { token: bearerToken, source: 'authorization' };
    }
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const adminAccessToken = getCookieValue(cookieHeader, 'admin_accessToken');
  const accessToken = getCookieValue(cookieHeader, 'accessToken');

  if (portal === 'admin') {
    if (adminAccessToken !== undefined) {
      return { token: adminAccessToken, source: 'admin_accessToken' };
    }
  } else if (accessToken !== undefined) {
    return { token: accessToken, source: 'accessToken' };
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

function normalizeRoles(payload: Partial<SkillHubCoreTokenPayload> & { role?: unknown }): string[] {
  const rawRoles = Array.isArray(payload.roles)
    ? payload.roles
    : typeof payload.role === 'string'
      ? [payload.role]
      : [];

  const roles = rawRoles
    .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
    .map((role) => role.trim().toLowerCase());

  if (roles.length === 0) {
    return ['user'];
  }

  return Array.from(new Set(roles));
}

export async function verifyAccessToken(token: string, secret: string): Promise<SkillHubCoreTokenPayload> {
  // Do NOT require issuer — quiz-api-server tokens do not set one.
  // SkillHubCore tokens may have issuer='skillhubcore.in', but that's optional now.
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  const claims = payload as typeof payload & JwtPayloadWithLegacyClaims;

  const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
  if (sub.length === 0) {
    throw new Error('Invalid token payload: missing subject');
  }

  // Build a compatible payload shape — keep support for legacy tokens that do not carry
  // tokenType/brand while still normalizing role values for strict portal checks.
  const roles = normalizeRoles(payload as Partial<SkillHubCoreTokenPayload> & { role?: unknown });
  const subscriptions = Array.isArray(claims.subscriptions) ? claims.subscriptions : [];
  const tokenType = normalizeString(claims.tokenType);
  const role = normalizeString(claims.role);
  const brand = normalizeString(claims.brand);
  const shadowUserId = normalizeString((claims as { shadowUserId?: unknown }).shadowUserId);
  const originalUserId = normalizeString((claims as { originalUserId?: unknown }).originalUserId);
  const platforms = Array.isArray((claims as { platforms?: unknown }).platforms)
    ? (claims as { platforms: string[] }).platforms
    : undefined;

  if (shadowUserId === undefined || originalUserId === undefined) {
    throw new Error('Invalid token payload: missing shadow or original user id');
  }

  return {
    ...payload,
    sub: shadowUserId,
    shadowUserId,
    originalUserId,
    ...(platforms !== undefined ? { platforms } : {}),
    roles,
    subscriptions,
    tokenType,
    role,
    brand,
  } as unknown as SkillHubCoreTokenPayload;
}

export async function authenticateRequest(
  request: Request,
  env: GatewayBindings,
  route?: RouteLike,
): Promise<AuthResolution | Response> {
  const portal = detectRequestPortal(request, route);
  const requestBrand = detectRequestBrand(request);
  const selection = getTokenFromHeaders(request, portal);
  const token = selection.token;

  if (token === undefined || token.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const verificationSecrets = portal === 'admin'
      ? Array.from(new Set([
          env.ADMIN_JWT_SECRET ?? env.JWT_SECRET,
          env.JWT_SECRET,
        ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)))
      : [env.JWT_SECRET];

    let payload: SkillHubCoreTokenPayload | undefined;
    let lastError: unknown;

    for (const secret of verificationSecrets) {
      try {
        payload = await verifyAccessToken(token, secret);
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (payload === undefined) {
      throw lastError instanceof Error ? lastError : new Error('Unauthorized');
    }

    const tokenType = normalizeString(payload.tokenType);
    const expectedTokenType = portal === 'admin' ? 'admin' : 'user';
    if (tokenType === undefined || tokenType !== expectedTokenType) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    const tokenBrand = normalizeString(payload.brand);
    if (tokenBrand !== undefined && requestBrand !== undefined && tokenBrand !== requestBrand) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (portal === 'admin' && hasRequiredRole(payload, 'admin') === false) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    return {
      payload,
      portal,
      tokenSource: selection.source ?? 'authorization',
      requestBrand,
    };
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
}
