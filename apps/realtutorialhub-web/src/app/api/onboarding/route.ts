import type { NextRequest } from 'next/server';

import { proxyUpstreamRequest } from '../../../../../../src/share-branding/auth/authBffRoute';

export const dynamic = 'force-dynamic';

const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';

export async function POST(request: NextRequest) {
  return proxyUpstreamRequest(request, { fallbackApiBase: FALLBACK_API_BASE, upstreamPath: 'onboarding' });
}
