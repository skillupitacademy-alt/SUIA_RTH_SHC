import type { NextRequest } from 'next/server';

import { FALLBACK_API_BASE_SKILLUP, proxyUpstreamRequest } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return proxyUpstreamRequest(request, {
    fallbackApiBase: FALLBACK_API_BASE_SKILLUP,
    upstreamPath: 'api/quiz/result',
  });
}
