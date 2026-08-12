import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { proxyUpstreamRequest, FALLBACK_API_BASE_SKILLHUBCORE } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SHC Admin Login Proxy
 * 
 * Routes to SHC-specific auth endpoint (/shc/auth/login)
 * Extracts tokens from response and sets them as HTTP-only cookies
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  console.log(JSON.stringify({
    tag: 'SHC_LOGIN_ROUTE',
    message: '🔥 SHC Login route handler invoked',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: {
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      'user-agent': request.headers.get('user-agent')?.substring(0, 50),
    },
  }));

  try {
    const response = await proxyUpstreamRequest(request, { 
      fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE, 
      upstreamPath: 'api/shc/auth/login'
    });

    // 🔥 CRITICAL FIX: Extract tokens and set as cookies
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      try {
        // Clone response to read body
        const responseClone = response.clone();
        const responseBody = await responseClone.json();
        
        console.log(JSON.stringify({
          tag: 'SHC_LOGIN_RESPONSE',
          message: '✅ Login response',
          timestamp: new Date().toISOString(),
          status: response.status,
          duration: `${duration}ms`,
          onboardingCompleted: responseBody?.user?.onboardingCompleted,
          userId: responseBody?.user?.id?.slice(0, 8),
          email: responseBody?.user?.email,
          hasAccessToken: !!responseBody?.accessToken,
          hasRefreshToken: !!responseBody?.refreshToken,
        }));

        // 🔥 CRITICAL: Set tokens as HTTP-only cookies
        if (responseBody.accessToken || responseBody.refreshToken) {
          const newResponse = new NextResponse(JSON.stringify(responseBody), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });

          // Get domain from request
          const hostname = request.headers.get('host') || '';
          const domain = hostname.includes('skillhubcore.in') ? '.skillhubcore.in' : undefined;

          // Set access token cookie (session cookie - lasts until browser closes or explicit logout)
          if (responseBody.accessToken) {
            const accessTokenCookie = [
              `accessToken=${responseBody.accessToken}`,
              'Path=/',
              domain ? `Domain=${domain}` : '',
              'HttpOnly',
              'Secure',
              'SameSite=None',
              // No Max-Age = session cookie (expires when browser closes or on logout)
            ].filter(Boolean).join('; ');
            
            newResponse.headers.append('set-cookie', accessTokenCookie);

            const adminAccessTokenCookie = [
              `admin_accessToken=${responseBody.accessToken}`,
              'Path=/',
              domain ? `Domain=${domain}` : '',
              'HttpOnly',
              'Secure',
              'SameSite=None',
            ].filter(Boolean).join('; ');

            newResponse.headers.append('set-cookie', adminAccessTokenCookie);
            
            console.log(JSON.stringify({
              tag: 'SHC_LOGIN_COOKIE',
              message: '🍪 Setting accessToken cookie (session cookie)',
              domain,
            }));
          }

          // Set refresh token cookie (session cookie - lasts until browser closes or explicit logout)
          if (responseBody.refreshToken) {
            const refreshTokenCookie = [
              `refreshToken=${responseBody.refreshToken}`,
              'Path=/',
              domain ? `Domain=${domain}` : '',
              'HttpOnly',
              'Secure',
              'SameSite=None',
              // No Max-Age = session cookie (expires when browser closes or on logout)
            ].filter(Boolean).join('; ');
            
            newResponse.headers.append('set-cookie', refreshTokenCookie);

            const adminRefreshTokenCookie = [
              `admin_refreshToken=${responseBody.refreshToken}`,
              'Path=/',
              domain ? `Domain=${domain}` : '',
              'HttpOnly',
              'Secure',
              'SameSite=None',
            ].filter(Boolean).join('; ');

            newResponse.headers.append('set-cookie', adminRefreshTokenCookie);
            
            console.log(JSON.stringify({
              tag: 'SHC_LOGIN_COOKIE',
              message: '🍪 Setting refreshToken cookie (session cookie)',
              domain,
            }));
          }

          return newResponse;
        }
      } catch (error) {
        console.log(JSON.stringify({
          tag: 'SHC_LOGIN_RESPONSE',
          message: '✅ Login proxy completed (could not parse JSON for cookie setting)',
          timestamp: new Date().toISOString(),
          status: response.status,
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : 'unknown',
        }));
      }
    }

    return response;
  } catch (error) {
    console.error(JSON.stringify({
      tag: 'SHC_LOGIN_ROUTE',
      message: '❌ SHC Login proxy failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }));
    throw error;
  }
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  console.log(JSON.stringify({
    tag: 'SHC_LOGIN_ROUTE',
    message: '🔍 OPTIONS preflight request',
    timestamp: new Date().toISOString(),
    url: request.url,
  }));

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

