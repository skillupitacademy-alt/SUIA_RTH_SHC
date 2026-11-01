import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

export type FacultyBrand = 'realtutorialhub' | 'skillup';

export interface FacultyIdentity {
  userId: string;
  shadowUserId?: string;
  originalUserId?: string;
  brand: FacultyBrand;
  roles?: string[];
}

export function getFacultyUpstreamBaseUrl() {
  const values = [
    process.env.INTERNAL_API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];

  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().replace(/\/+$/, '');
    }
  }

  return null;
}

export function getFacultyPortalBaseUrl(source?: Headers | HeadersInit) {
  const sourceHeaders = source === undefined ? null : source instanceof Headers ? source : new Headers(source);
  const host = sourceHeaders?.get('x-forwarded-host') ?? sourceHeaders?.get('host');
  if (typeof host === 'string' && host.trim().length > 0) {
    const protocol = sourceHeaders?.get('x-forwarded-proto') ?? 'http';
    return `${protocol}://${host.trim().replace(/\/+$/, '')}`;
  }

  const values = [
    process.env.NEXT_PUBLIC_FACULTY_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ];

  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().replace(/\/+$/, '');
    }
  }

  return null;
}

export async function relayJsonResponse(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType !== null) {
    headers.set('content-type', contentType);
  }
  headers.set('cache-control', 'no-store');
  return new NextResponse(await response.text(), {
    status: response.status,
    headers,
  });
}

function appendHeader(headers: Headers, key: string, value: string | null | undefined) {
  if (typeof value === 'string' && value.trim().length > 0) {
    headers.set(key, value);
  }
}

/**
 * Resolves a verified FacultyIdentity from the incoming request.
 * Prioritizes cryptographic verification of the accessToken cookie,
 * falling back to verified headers injected by proxy middleware.
 */
export async function getFacultyIdentity(request: NextRequest): Promise<FacultyIdentity | null> {
  // 1. Verify from accessToken cookie if present
  const token = request.cookies.get('accessToken')?.value;
  if (token) {
    try {
      const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
      const brand = payload.brand;
      if (brand === 'realtutorialhub' || brand === 'skillup') {
        const userId = payload.shadowUserId ?? payload.userId ?? payload.sub;
        if (userId) {
          return {
            userId,
            shadowUserId: payload.shadowUserId ?? userId,
            originalUserId: payload.originalUserId ?? userId,
            brand,
            roles: payload.roles ?? [],
          };
        }
      }
    } catch {
      // Fall through to middleware-verified headers
    }
  }

  // 2. Extract verified headers from proxy middleware
  const headerBrand = request.headers.get('x-brand');
  const headerUserId = request.headers.get('x-user-id') ?? request.headers.get('x-shadow-user-id');
  if (headerUserId && (headerBrand === 'realtutorialhub' || headerBrand === 'skillup')) {
    const rolesHeader = request.headers.get('x-user-roles');
    return {
      userId: headerUserId,
      shadowUserId: request.headers.get('x-shadow-user-id') ?? headerUserId,
      originalUserId: request.headers.get('x-original-user-id') ?? headerUserId,
      brand: headerBrand,
      roles: rolesHeader ? rolesHeader.split(',').map((r) => r.trim()).filter(Boolean) : [],
    };
  }

  return null;
}

/**
 * Builds headers for upstream API server dispatch.
 * 🔒 SECURITY: Requires verified FacultyIdentity. All brand, user ID,
 * and role headers are derived exclusively from the verified identity.
 * No untrusted fallback to client-supplied source headers.
 */
export function buildFacultyUpstreamHeaders(
  source: Headers | HeadersInit,
  identity: FacultyIdentity,
  extra?: HeadersInit
): Headers {
  const headers = new Headers();
  const sourceHeaders = source instanceof Headers ? source : new Headers(source);

  appendHeader(headers, 'accept', 'application/json');
  appendHeader(headers, 'cookie', sourceHeaders.get('cookie'));
  
  const gatewaySecret = process.env.GATEWAY_TRUST_SECRET ?? process.env.INTERNAL_GATEWAY_SECRET;
  appendHeader(headers, 'x-gateway-secret', gatewaySecret);
  appendHeader(headers, 'x-portal-identity', sourceHeaders.get('x-portal-identity') ?? 'faculty');

  appendHeader(headers, 'x-brand', identity.brand);
  appendHeader(headers, 'x-platform', identity.brand);
  appendHeader(headers, 'x-user-id', identity.userId);
  appendHeader(headers, 'x-shadow-user-id', identity.shadowUserId ?? identity.userId);
  if (identity.originalUserId) {
    appendHeader(headers, 'x-original-user-id', identity.originalUserId);
  }
  if (identity.roles && identity.roles.length > 0) {
    appendHeader(headers, 'x-user-roles', identity.roles.join(','));
  }

  if (extra !== undefined) {
    const extraMap = new Headers(extra);
    extraMap.forEach((value, key) => headers.set(key, value));
  }

  return headers;
}

export async function fetchFacultyUpstreamJson<T>(
  identity: FacultyIdentity,
  source: Headers | HeadersInit,
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const upstream = getFacultyUpstreamBaseUrl();
  if (upstream === null) {
    return null;
  }

  const response = await fetch(new URL(path, upstream), {
    ...init,
    headers: buildFacultyUpstreamHeaders(source, identity, init?.headers),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function fetchFacultyPortalJson<T>(
  identity: FacultyIdentity,
  source: Headers | HeadersInit,
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const portal = getFacultyPortalBaseUrl(source);
  if (portal === null) {
    return null;
  }

  const response = await fetch(new URL(path, portal), {
    ...init,
    headers: buildFacultyUpstreamHeaders(source, identity, init?.headers),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function relayFacultyUpstreamResponse(
  identity: FacultyIdentity,
  source: Headers | HeadersInit,
  path: string,
  init?: RequestInit
) {
  const upstream = getFacultyUpstreamBaseUrl();
  if (upstream === null) {
    return null;
  }

  const response = await fetch(new URL(path, upstream), {
    ...init,
    headers: buildFacultyUpstreamHeaders(source, identity, init?.headers),
    cache: 'no-store',
  });

  return relayJsonResponse(response);
}
