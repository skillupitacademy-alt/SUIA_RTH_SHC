import type { NextRequest } from 'next/server';
import { proxyAuthRequest, FALLBACK_API_BASE_SKILLUP } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
export async function GET(request: NextRequest) {
  return proxyAuthRequest(request, { 
    fallbackApiBase: FALLBACK_API_BASE_SKILLUP, 
    authPath: 'sessions' 
  });
}

/**
 * DELETE /api/auth/sessions  
 * Global logout - revoke all sessions
 */
export async function DELETE(request: NextRequest) {
  return proxyAuthRequest(request, { 
    fallbackApiBase: FALLBACK_API_BASE_SKILLUP, 
    authPath: 'sessions' 
  });
}