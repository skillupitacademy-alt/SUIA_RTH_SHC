import { requireAdminRequest } from '@/lib/admin-route-guard';
import type { NextRequest } from 'next/server';

import { FALLBACK_API_BASE_SKILLHUBCORE, proxyUpstreamRequest } from '@/lib/upstream-proxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  return proxyUpstreamRequest(request, {
    fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE,
    upstreamPath: 'api/factory/check-duplicates',
  });
}
