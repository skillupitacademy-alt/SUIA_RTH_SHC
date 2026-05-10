import type { NextRequest } from 'next/server';

import { proxyUpstreamRequest, FALLBACK_API_BASE_SKILLHUBCORE } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SHC Admin Session Check Proxy (Shared Auth Path)
 * 
 * Routes to SHC-specific auth endpoint (/api/shc/auth/me)
 * Used by shared auth validation (validateAuthState)
 * 
 * Note: This is the same as /api/admin/auth/me but at the standard /api/auth/me path
 * for compatibility with shared authentication code.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // 🔥 DETAILED LOGGING: Track request details
  console.log(JSON.stringify({
    tag: 'SHC_AUTH_ME_REQUEST',
    message: '🔍 Session validation via /api/auth/me',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: {
      cookie: request.headers.get('cookie') ? 'present' : 'missing',
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    },
  }));

  const response = await proxyUpstreamRequest(request, { 
    fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE, 
    upstreamPath: 'api/shc/auth/me' 
  });

  // 🔥 DETAILED LOGGING: Track response details
  const duration = Date.now() - startTime;
  const responseClone = response.clone();
  
  try {
    const responseBody = await responseClone.json();
    console.log(JSON.stringify({
      tag: 'SHC_AUTH_ME_RESPONSE',
      message: '✅ Session validation response',
      timestamp: new Date().toISOString(),
      status: response.status,
      duration: `${duration}ms`,
      onboardingCompleted: responseBody?.user?.onboardingCompleted,
      userId: responseBody?.user?.id?.slice(0, 8),
      email: responseBody?.user?.email,
      role: responseBody?.user?.role,
      isAdmin: responseBody?.user?.isAdmin,
    }));
  } catch (error) {
    console.log(JSON.stringify({
      tag: 'SHC_AUTH_ME_RESPONSE',
      message: '❌ Session validation response (non-JSON)',
      timestamp: new Date().toISOString(),
      status: response.status,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
  }

  return response;
}
