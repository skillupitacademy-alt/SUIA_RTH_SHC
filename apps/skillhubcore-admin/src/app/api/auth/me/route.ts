import type { NextRequest } from 'next/server';
import { proxyUpstreamRequest, FALLBACK_API_BASE_SKILLHUBCORE } from '@/lib/upstream-proxy';
import { requireAdminRequest } from '@/lib/admin-route-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;
  const response = await proxyUpstreamRequest(request, {
    fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE, upstreamPath: 'api/shc/auth/me',
  });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
