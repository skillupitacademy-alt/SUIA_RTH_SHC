import type { NextRequest } from 'next/server';
import { proxyAuthRequest } from '@/share-branding/auth/authBffRoute';

export const dynamic = 'force-dynamic';

const FALLBACK_API_BASE = 'https://api.skillupitacademy.com/api';

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
export async function GET(request: NextRequest) {
  return proxyAuthRequest(request, { 
    fallbackApiBase: FALLBACK_API_BASE, 
    authPath: 'sessions' 
  });
}

/**
 * DELETE /api/auth/sessions  
 * Global logout - revoke all sessions
 */
export async function DELETE(request: NextRequest) {
  return proxyAuthRequest(request, { 
    fallbackApiBase: FALLBACK_API_BASE, 
    authPath: 'sessions' 
  });
}