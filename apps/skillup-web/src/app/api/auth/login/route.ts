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

function getBaseUrls(): string[] {
  const rawBase = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.skillupitacademy.com').trim();
  const normalized = rawBase.replace(/\/+$/, '');
  const withoutApiSuffix = normalized.replace(/\/api$/i, '');

  return Array.from(new Set([
    `${withoutApiSuffix}/auth/login`,
    `${withoutApiSuffix}/api/auth/login`,
  ]));
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
  return combined === null || combined.trim().length === 0 ? [] : [combined];
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set('content-type', 'application/json');
  forwardedHeaders.set('accept', 'application/json');
  forwardedHeaders.delete('host');

  let upstreamResponse: Response | null = null;

  for (const url of getBaseUrls()) {
    const candidate = await fetch(url, {
      method: 'POST',
      headers: forwardedHeaders,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });

    upstreamResponse = candidate;
    if (candidate.status !== 404) {
      break;
    }
  }

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

  for (const cookie of getSetCookies(upstreamResponse.headers)) {
    response.headers.append('set-cookie', rewriteSetCookie(cookie, request.nextUrl.hostname));
  }

  return response;
}
