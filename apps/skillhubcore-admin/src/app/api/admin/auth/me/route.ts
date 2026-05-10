import type { NextRequest } from 'next/server';

import { proxyUpstreamRequest, FALLBACK_API_BASE_SKILLHUBCORE } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';

/**
 * SHC Admin Session Check Proxy
 * 
 * Routes to SHC-specific auth endpoint (/api/shc/auth/me)
 * Used by AdminGuard to validate session
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  console.log(JSON.stringify({
    tag: 'SHC_ADMIN_AUTH_ME_REQUEST',
    message: '🔍 Admin session validation via /api/admin/auth/me',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: {
      cookie: request.headers.get('cookie') ? 'present' : 'missing',
      cookieLength: request.headers.get('cookie')?.length || 0,
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
      tag: 'SHC_ADMIN_AUTH_ME_RESPONSE',
      message: response.status === 200 ? '✅ Admin session validation success' : '❌ Admin session validation failed',
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
      tag: 'SHC_ADMIN_AUTH_ME_RESPONSE',
      message: '❌ Admin session validation response (non-JSON)',
      timestamp: new Date().toISOString(),
      status: response.status,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
  }

  return response;
}
