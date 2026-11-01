import { NextResponse, type NextRequest } from 'next/server';
import { proxyUpstreamRequest, FALLBACK_API_BASE_SKILLHUBCORE } from '@/lib/upstream-proxy';
import { requireAdminMutationOrigin } from '@/lib/admin-route-guard';
import { clearAdminSessionCookies } from '@/lib/admin-session-cookies';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const denied = requireAdminMutationOrigin(request);
  if (denied) return denied;
  let response: NextResponse;
  try {
    const upstream = await proxyUpstreamRequest(request, {
      fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE, upstreamPath: 'api/shc/auth/logout',
    });
    response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });
  } catch {
    response = NextResponse.json({ error: 'Authentication service unavailable' }, {
      status: 502, headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  clearAdminSessionCookies(response);
  return response;
}
