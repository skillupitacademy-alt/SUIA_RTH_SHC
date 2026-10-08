import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function normalizeHost(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return undefined;
  }

  const host = trimmed.split('/')[0]?.split(':')[0]?.replace(/^\.+/, '');
  if (host === undefined || host.length === 0 || host.includes('.') === false) {
    return undefined;
  }

  const labels = host.split('.').filter(Boolean);
  if (labels.length <= 2) {
    return host;
  }

  return `.${labels.slice(-2).join('.')}`;
}

function getUpstreamBaseUrl(): string {
  const raw = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.skillhubcore.in').trim();
  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  return withoutTrailingSlash.toLowerCase().endsWith('/api')
    ? withoutTrailingSlash.slice(0, -4)
    : withoutTrailingSlash;
}

function getRequestOrigin(request: NextRequest): string {
  return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
}

function rewriteSetCookie(cookie: string, requestHost: string): string {
  const cookieDomain = normalizeHost(requestHost);
  if (cookieDomain === undefined) {
    return cookie.replace(/;\s*Domain=[^;]+/i, '');
  }

  if (/;\s*Domain=/i.test(cookie)) {
    return cookie.replace(/;\s*Domain=[^;]+/i, `; Domain=${cookieDomain}`);
  }

  return `${cookie}; Domain=${cookieDomain}`;
}

function getSetCookies(headers: Headers): string[] {
  const withHelper = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withHelper.getSetCookie === 'function') {
    return withHelper.getSetCookie();
  }

  const combined = headers.get('set-cookie');
  if (combined === null || combined.trim().length === 0) {
    return [];
  }

  return [combined];
}

async function proxyToUpstream(request: NextRequest, path: string[]): Promise<NextResponse> {
  const upstreamBase = getUpstreamBaseUrl();
  const upstreamPath = `/${path.join('/')}`;
  const upstreamUrl = `${upstreamBase}${upstreamPath}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);

  headers.set('origin', getRequestOrigin(request));
  headers.delete('host');

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    redirect: 'manual',
    cache: 'no-store',
  });

  const body = request.method === 'HEAD' ? null : await response.arrayBuffer();
  const nextResponse = new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
  });

  response.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === 'set-cookie') {
      return;
    }
    nextResponse.headers.set(key, value);
  });

  for (const cookie of getSetCookies(response.headers)) {
    nextResponse.headers.append('set-cookie', rewriteSetCookie(cookie, request.nextUrl.hostname));
  }

  return nextResponse;
}

type RouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

async function handle(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const path = Array.isArray(params.path) ? params.path : typeof params.path === 'string' ? [params.path] : [];
  return proxyToUpstream(request, path);
}

export const dynamic = 'force-dynamic';

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
