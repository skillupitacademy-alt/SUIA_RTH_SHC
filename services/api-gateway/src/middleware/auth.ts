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

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const match = cookieHeader.match(pattern);
  return match?.[1] !== undefined ? decodeURIComponent(match[1]) : undefined;
}

function parseHostname(value: string | null): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;

  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function detectBrandFromHost(hostname: string | null): string | undefined {
  if (typeof hostname !== 'string' || hostname.length === 0) return undefined;
  if (hostname.includes('realtutorialhub')) return 'realtutorialhub';
  if (hostname.includes('skillup')) return 'skillup';
  return undefined;
}

export function detectRequestBrand(request: Request, route?: RouteLike): string | undefined {
  const requestUrl = new URL(request.url);
  const originHost = parseHostname(request.headers.get('origin')) ?? parseHostname(request.headers.get('referer'));
  return (
    detectBrandFromHost(originHost) ??
    detectBrandFromHost(requestUrl.hostname.toLowerCase()) ??
    detectBrandFromHost(route?.host?.toLowerCase() ?? null)
  );
}

export function detectRequestPortal(request: Request, route?: RouteLike): PortalKind {
  const requestUrl = new URL(request.url);
  const hostname = requestUrl.hostname.toLowerCase();
  const originHost = parseHostname(request.headers.get('origin')) ?? parseHostname(request.headers.get('referer'));

  if (route?.requireRole === 'admin' || route?.upstreamKey === 'ADMIN_URL' || route?.prefix === '/admin') {
    return 'admin';
  }

  if (originHost?.startsWith('admin.') === true) {
    return 'admin';
  }

  if (hostname.startsWith('admin.') === true) {
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

  const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
  // quiz-api-server stores userId in a custom claim; fall back to sub
  const userId = typeof (payload as any).userId === 'string' ? (payload as any).userId : sub;

  if (userId.length === 0) {
    throw new Error('Invalid token payload: missing user identifier');
  }

  // Build a compatible payload shape — keep support for legacy tokens that do not carry
  // tokenType/brand while still normalizing role values for strict portal checks.
  const roles = normalizeRoles(payload as Partial<SkillHubCoreTokenPayload> & { role?: unknown });
  const subscriptions = Array.isArray((payload as any).subscriptions) ? (payload as any).subscriptions : [];
  const tokenType = normalizeString((payload as any).tokenType);
  const role = normalizeString((payload as any).role);
  const brand = normalizeString((payload as any).brand);

  return {
    ...payload,
    sub: userId,
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
  const requestBrand = detectRequestBrand(request, route);
  const selection = getTokenFromHeaders(request, portal);
  const token = selection.token;

  if (token === undefined || token.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const payload = await verifyAccessToken(token, env.JWT_SECRET);

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
