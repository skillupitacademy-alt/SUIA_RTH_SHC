import { NextResponse, type NextRequest } from 'next/server';
import { proxyUpstreamRequest, FALLBACK_API_BASE_SKILLHUBCORE } from '@/lib/upstream-proxy';
import { requireAdminMutationOrigin } from '@/lib/admin-route-guard';
import { setAdminSessionCookies } from '@/lib/admin-session-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const denied = requireAdminMutationOrigin(request);
  if (denied) return denied;
  try {
    const upstream = await proxyUpstreamRequest(request, {
      fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE, upstreamPath: 'api/shc/auth/login',
    });
    const body = await upstream.json();
    const { accessToken, refreshToken, ...publicBody } = body;
    const response = NextResponse.json(publicBody, {
      status: upstream.status, headers: { 'Cache-Control': 'private, no-store' },
    });
    if (upstream.ok) {
      if (typeof accessToken !== 'string' || !accessToken || typeof refreshToken !== 'string' || !refreshToken) {
        return NextResponse.json({ error: 'Invalid authentication response' }, { status: 502 });
      }
      setAdminSessionCookies(response, accessToken, refreshToken);
    }
    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication service unavailable' }, {
      status: 502, headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
