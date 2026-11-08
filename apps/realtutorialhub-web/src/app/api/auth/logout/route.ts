import type { NextRequest } from 'next/server';

import { proxyAuthRequest, FALLBACK_API_BASE_RTH } from '../../../../../../../src/share-branding/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Delegate directly to the canonical auth proxy which securely forwards the revocation request
  // to upstream API server and rewrites Set-Cookie headers with matching Domain and Path.
  return proxyAuthRequest(request, {
    fallbackApiBase: FALLBACK_API_BASE_RTH,
    authPath: 'logout',
  });
}
