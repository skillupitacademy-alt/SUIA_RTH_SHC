import { clearAuthCookies } from '@quiz/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { FALLBACK_API_BASE_RTH, proxyAuthRequest } from '../../../../../../../src/share-branding/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let response: NextResponse;
  try {
    response = await proxyAuthRequest(request, {
      fallbackApiBase: FALLBACK_API_BASE_RTH,
      authPath: 'logout',
    });
  } catch {
    response = NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Ensure admin cookies and tokens are cleared from the response
  clearAuthCookies(response, 'realtutorialhub', true);
  clearAuthCookies(response, 'realtutorialhub', false);

  return response;
}

