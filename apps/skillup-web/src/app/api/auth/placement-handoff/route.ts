import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  createForwardHeaders,
  extractCookieValue,
  fetchAuthUpstream,
  getSetCookies,
  rewriteSetCookie,
  FALLBACK_API_BASE_SKILLUP,
} from '../../../../../../../src/share-branding/auth';

export const dynamic = 'force-dynamic';

const PLACEMENT_HANDOFF_URL = 'https://placement.skillhubcore.in/api/auth/handoff';

function normalizeRedirectTo(rawValue: unknown): string {
  if (typeof rawValue === 'string' && rawValue.startsWith('/') && rawValue.startsWith('//') === false) {
    return rawValue;
  }

  return '/dashboard/profile';
}

function resolveRequestHost(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (typeof forwardedHost === 'string' && forwardedHost.trim().length > 0) {
    return forwardedHost.split(',')[0]?.trim() ?? request.nextUrl.hostname;
  }

  return request.headers.get('host') ?? request.nextUrl.hostname;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as { redirectTo?: unknown };
  const redirectTo = normalizeRedirectTo(payload.redirectTo);

  let accessToken = request.cookies.get('accessToken')?.value?.trim() ?? '';
  let refreshedSetCookies: string[] = [];

  if (accessToken.length === 0) {
    const refreshResponse = await fetchAuthUpstream(request, {
      fallbackApiBase: FALLBACK_API_BASE_SKILLUP,
      authPath: 'refresh',
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (refreshResponse === null || refreshResponse.ok === false) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    refreshedSetCookies = getSetCookies(refreshResponse.headers);
    accessToken = extractCookieValue(refreshedSetCookies, 'accessToken')?.trim() ?? '';

    if (accessToken.length === 0) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
  }

  const handoffResponse = await fetch(PLACEMENT_HANDOFF_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...Object.fromEntries(createForwardHeaders(request).entries()),
      'content-type': 'application/json',
      'x-brand': 'skillup',
    },
    body: JSON.stringify({
      accessToken,
      redirectTo,
      brand: 'skillup',
    }),
    redirect: 'manual',
    cache: 'no-store',
  });

  const body = await handoffResponse.arrayBuffer();
  const response = new NextResponse(body, {
    status: handoffResponse.status,
    statusText: handoffResponse.statusText,
  });

  handoffResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      response.headers.set(key, value);
    }
  });

  const requestHost = resolveRequestHost(request);
  for (const cookie of refreshedSetCookies) {
    response.headers.append('set-cookie', rewriteSetCookie(cookie, requestHost));
  }

  return response;
}
