import type { NextRequest } from 'next/server';
import { proxyAuthRequest } from '@/share-branding/auth/authBffRoute';

export const dynamic = 'force-dynamic';

const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';

/**
 * DELETE /api/auth/sessions/[sessionId]
 * Revoke specific session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  return proxyAuthRequest(request, { 
    fallbackApiBase: FALLBACK_API_BASE, 
    authPath: `sessions/${sessionId}` 
  });
}