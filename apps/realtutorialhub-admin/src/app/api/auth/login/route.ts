import type { NextRequest } from 'next/server';

import { FALLBACK_API_BASE_RTH,proxyAuthRequest } from '../../../../../../../src/share-branding/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return proxyAuthRequest(request, {
    fallbackApiBase: FALLBACK_API_BASE_RTH,
    authPath: 'login',
  });
}

