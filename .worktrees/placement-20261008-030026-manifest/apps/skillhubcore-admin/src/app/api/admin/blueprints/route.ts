import type { NextRequest } from 'next/server';

import { FALLBACK_API_BASE_SKILLHUBCORE, proxyUpstreamRequest } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return proxyUpstreamRequest(request, {
    fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE,
    upstreamPath: 'api/admin/blueprints',
  });
}

export async function POST(request: NextRequest) {
  return proxyUpstreamRequest(request, {
    fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE,
    upstreamPath: 'api/admin/blueprints',
  });
}
