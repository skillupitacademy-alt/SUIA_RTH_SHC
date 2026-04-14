import type { NextRequest } from 'next/server';

import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';

export const dynamic = 'force-dynamic';

const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';

export async function GET(request: NextRequest) {
  return proxyAuthRequest(request, { fallbackApiBase: FALLBACK_API_BASE, authPath: 'reset-password' });
}

export async function POST(request: NextRequest) {
  return proxyAuthRequest(request, { fallbackApiBase: FALLBACK_API_BASE, authPath: 'reset-password' });
}
