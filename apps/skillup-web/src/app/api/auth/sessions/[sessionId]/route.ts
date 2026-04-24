import type { NextRequest } from 'next/server';
import { proxyAuthRequest, FALLBACK_API_BASE_SKILLUP } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';

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
    fallbackApiBase: FALLBACK_API_BASE_SKILLUP, 
    authPath: `sessions/${sessionId}` 
  });
}