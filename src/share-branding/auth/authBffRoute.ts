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

function isPreferredUpstream(baseUrl: string): boolean {
  return baseUrl.includes('vercel.app') === false;
}

export function getConfiguredAuthBaseUrls(fallbackApiBase: string): string[] {
  const candidates = [
    process.env.INTERNAL_API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    fallbackApiBase,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim().replace(/\/+$/, ''));

  const preferred = candidates.filter(isPreferredUpstream);
  const fallback = candidates.filter((value) => preferred.includes(value) === false);

  return Array.from(new Set([...preferred, ...fallback]));
}

export function getUpstreamUrls(fallbackApiBase: string, upstreamPath: string): string[] {
  const normalizedPath = upstreamPath.replace(/^\/+/, '');
  return getConfiguredAuthBaseUrls(fallbackApiBase).map((baseUrl) => {
    const withoutTrailingSlash = baseUrl.replace(/\/+$/, '');
    const normalizedBase = withoutTrailingSlash.toLowerCase().endsWith('/api')
      ? withoutTrailingSlash
      : `${withoutTrailingSlash}/api`;
    return `${normalizedBase}/${normalizedPath}`;
  });
}

export function getAuthUpstreamUrls(fallbackApiBase: string, authPath: string): string[] {
  const normalizedAuthPath = authPath.replace(/^\/+/, '');
  return getConfiguredAuthBaseUrls(fallbackApiBase).flatMap((baseUrl) => {
    const withoutApiSuffix = baseUrl.replace(/\/api$/i, '');

    return [
      `${withoutApiSuffix}/auth/${normalizedAuthPath}`,
      `${withoutApiSuffix}/api/auth/${normalizedAuthPath}`,
    ];
  });
}

function normalizeHost(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) return undefined;

  const host = trimmed.split('/')[0]?.split(':')[0]?.replace(/^\.+/, '');
  if (host === undefined || host.length === 0 || host.includes('.') === false) {
    return undefined;
  }

  const labels = host.split('.').filter(Boolean);
  if (labels.length <= 2) return host;
  return `.${labels.slice(-2).join('.')}`;
}

function getRequestHost(request: NextRequest): string | undefined {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (typeof forwardedHost === 'string' && forwardedHost.trim().length > 0) {
    return forwardedHost.split(',')[0]?.trim();
  }

  return request.headers.get('host') ?? request.nextUrl.hostname;
}

export function rewriteSetCookie(cookie: string, requestHost?: string): string {
  const cookieDomain = normalizeHost(requestHost);
  if (cookieDomain === undefined) {
    return cookie.replace(/;\s*Domain=[^;]+/i, '');
  }

  if (/;\s*Domain=/i.test(cookie)) {
    return cookie.replace(/;\s*Domain=[^;]+/i, `; Domain=${cookieDomain}`);
  }

  return `${cookie}; Domain=${cookieDomain}`;
}

export function getSetCookies(headers: Headers): string[] {
  const withHelper = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withHelper.getSetCookie === 'function') {
    return withHelper.getSetCookie();
  }

  const combined = headers.get('set-cookie');
  return combined === null || combined.trim().length === 0 ? [] : [combined];
}

export function extractCookieValue(setCookies: string[], cookieName: string): string | undefined {
  for (const cookie of setCookies) {
    const match = new RegExp(`(?:^|\\s*)${cookieName}=([^;]+)`, 'i').exec(cookie);
    if (match?.[1] !== undefined) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return undefined;
}

export function createForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  return headers;
}

export async function fetchUpstream(
  request: NextRequest,
  options: {
    fallbackApiBase: string;
    upstreamPath: string;
    method?: string;
    body?: BodyInit | null;
  },
): Promise<Response | null> {
  const method = options.method ?? request.method;
  const body =
    options.body !== undefined
      ? options.body
      : method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();
  const headers = createForwardHeaders(request);

  let upstreamResponse: Response | null = null;

  for (const url of getUpstreamUrls(options.fallbackApiBase, options.upstreamPath)) {
    const candidate = await fetch(`${url}${request.nextUrl.search}`, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });

    upstreamResponse = candidate;
    if (candidate.status !== 404) {
      break;
    }
  }

  return upstreamResponse;
}

export async function fetchAuthUpstream(
  request: NextRequest,
  options: {
    fallbackApiBase: string;
    authPath: string;
    method?: string;
    body?: BodyInit | null;
  },
): Promise<Response | null> {
  const method = options.method ?? request.method;
  const body =
    options.body !== undefined
      ? options.body
      : method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();
  const headers = createForwardHeaders(request);

  let upstreamResponse: Response | null = null;

  for (const url of getAuthUpstreamUrls(options.fallbackApiBase, options.authPath)) {
    const candidate = await fetch(`${url}${request.nextUrl.search}`, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });

    upstreamResponse = candidate;
    if (candidate.status !== 404) {
      break;
    }
  }

  return upstreamResponse;
}

export async function proxyUpstreamRequest(
  request: NextRequest,
  options: {
    fallbackApiBase: string;
    upstreamPath: string;
    method?: string;
    body?: BodyInit | null;
  },
) {
  const upstreamResponse = await fetchUpstream(request, options);

  if (upstreamResponse === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
  }

  const payload = await upstreamResponse.arrayBuffer();
  const response = new NextResponse(payload, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });

  upstreamResponse.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === 'set-cookie') {
      return;
    }
    response.headers.set(key, value);
  });

  const requestHost = getRequestHost(request);
  for (const cookie of getSetCookies(upstreamResponse.headers)) {
    response.headers.append('set-cookie', rewriteSetCookie(cookie, requestHost));
  }

  return response;
}

export async function proxyAuthRequest(
  request: NextRequest,
  options: {
    fallbackApiBase: string;
    authPath: string;
    method?: string;
    body?: BodyInit | null;
  },
) {
  const upstreamResponse = await fetchAuthUpstream(request, options);

  if (upstreamResponse === null) {
    return NextResponse.json({ error: 'Authentication upstream unavailable' }, { status: 502 });
  }

  const payload = await upstreamResponse.arrayBuffer();
  const response = new NextResponse(payload, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });

  upstreamResponse.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === 'set-cookie') {
      return;
    }
    response.headers.set(key, value);
  });

  const requestHost = getRequestHost(request);
  for (const cookie of getSetCookies(upstreamResponse.headers)) {
    response.headers.append('set-cookie', rewriteSetCookie(cookie, requestHost));
  }

  return response;
}
