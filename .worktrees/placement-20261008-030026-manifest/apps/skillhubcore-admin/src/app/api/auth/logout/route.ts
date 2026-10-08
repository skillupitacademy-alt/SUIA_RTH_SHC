import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { proxyUpstreamRequest, FALLBACK_API_BASE_SKILLHUBCORE } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';

/**
 * SHC Admin Logout Proxy
 * 
 * Routes to SHC-specific auth endpoint (/shc/auth/logout)
 * Clears authentication cookies after successful logout
 */
export async function POST(request: NextRequest) {
  console.log(JSON.stringify({
    tag: 'SHC_LOGOUT_ROUTE',
    message: '🔥 SHC Logout route handler invoked',
    timestamp: new Date().toISOString(),
  }));

  try {
    // Call upstream logout API
    const response = await proxyUpstreamRequest(request, { 
      fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE, 
      upstreamPath: 'api/shc/auth/logout' 
    });

    // If logout was successful, clear cookies
    if (response.status === 200) {
      const hostname = request.headers.get('host') || '';
      const domain = hostname.includes('skillhubcore.in') ? '.skillhubcore.in' : undefined;

      // Create new response with cleared cookies
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Clear access token cookie
      const clearAccessToken = [
        'accessToken=',
        'Path=/',
        domain ? `Domain=${domain}` : '',
        'HttpOnly',
        'Secure',
        'SameSite=None',
        'Max-Age=0', // Expire immediately
      ].filter(Boolean).join('; ');
      
      newResponse.headers.append('set-cookie', clearAccessToken);

      // Clear refresh token cookie
      const clearRefreshToken = [
        'refreshToken=',
        'Path=/',
        domain ? `Domain=${domain}` : '',
        'HttpOnly',
        'Secure',
        'SameSite=None',
        'Max-Age=0', // Expire immediately
      ].filter(Boolean).join('; ');
      
      newResponse.headers.append('set-cookie', clearRefreshToken);

      console.log(JSON.stringify({
        tag: 'SHC_LOGOUT_ROUTE',
        message: '✅ Logout successful, cookies cleared',
        timestamp: new Date().toISOString(),
      }));

      return newResponse;
    }

    return response;
  } catch (error) {
    console.error(JSON.stringify({
      tag: 'SHC_LOGOUT_ROUTE',
      message: '❌ SHC Logout proxy failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }));
    throw error;
  }
}

