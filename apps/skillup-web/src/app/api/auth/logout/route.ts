import type { NextRequest } from 'next/server';

import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';

export const dynamic = 'force-dynamic';

const FALLBACK_API_BASE = 'https://api.skillupitacademy.com/api';

export async function POST(request: NextRequest) {
  return proxyAuthRequest(request, { fallbackApiBase: FALLBACK_API_BASE, authPath: 'logout' });
}
