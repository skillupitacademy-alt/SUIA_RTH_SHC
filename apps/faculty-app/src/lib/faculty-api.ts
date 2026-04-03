import { NextResponse } from 'next/server';

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

export function buildFacultyUpstreamHeaders(source: Headers | HeadersInit, extra?: HeadersInit) {
  const headers = new Headers();
  const sourceHeaders = source instanceof Headers ? source : new Headers(source);

  appendHeader(headers, 'accept', 'application/json');
  appendHeader(headers, 'cookie', sourceHeaders.get('cookie'));
  appendHeader(headers, 'x-gateway-secret', process.env.INTERNAL_GATEWAY_SECRET);
  appendHeader(headers, 'x-portal-identity', sourceHeaders.get('x-portal-identity') ?? 'faculty');
  appendHeader(headers, 'x-user-id', sourceHeaders.get('x-user-id'));
  appendHeader(headers, 'x-shadow-user-id', sourceHeaders.get('x-shadow-user-id'));
  appendHeader(headers, 'x-original-user-id', sourceHeaders.get('x-original-user-id'));

  if (extra !== undefined) {
    const extraHeaders = new Headers(extra);
    extraHeaders.forEach((value, key) => headers.set(key, value));
  }

  return headers;
}

export async function fetchFacultyUpstreamJson<T>(
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
    headers: buildFacultyUpstreamHeaders(source, init?.headers),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function fetchFacultyPortalJson<T>(
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
    headers: buildFacultyUpstreamHeaders(source, init?.headers),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function relayFacultyUpstreamResponse(
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
    headers: buildFacultyUpstreamHeaders(source, init?.headers),
    cache: 'no-store',
  });

  return relayJsonResponse(response);
}
