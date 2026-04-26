import { type NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { resolveCookieDomain } from '@/lib/cookie-domain';
import { resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { withObservability } from '@/middleware/observability.middleware';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { clearOnboardingStateCookie } from '@/modules/auth/onboarding-state-cookie';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { clearAuthCookies, type Brand } from '@quiz/auth';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest, obsCtx: any) {
  const { requestId } = obsCtx; // 🔥 Use observability context
  const ip = getClientIp(_req);
  const tokenService = container.get(TokenService);
  const authService = container.get(AuthService);

  const _token = tokenService.getAccessToken(_req, { scope: 'user' });
  const adminToken = _req.cookies.get('admin_accessToken')?.value;
  const infraToken = _req.cookies.get('infra_accessToken')?.value;

  // ✅ Extract brand from request (hostname or header)
  const requestHostname = resolveRequestHostnameFromHeaders(_req.headers, _req.nextUrl.hostname);
  const brand: 'skillup' | 'realtutorialhub' = (typeof requestHostname === 'string' && requestHostname.includes('skillup')) ? 'skillup' : 'realtutorialhub';

  console.log('[AUTH_FLOW][LOGOUT][START]', JSON.stringify({
    requestId,
    brand,
    requestHostname,
  }));

  // 🔥 CRITICAL FIX: Extract userId from access token for deterministic logout
  let userId: string | undefined;
  try {
    if (typeof _token === 'string' && _token.trim() !== '') {
      const payload = await tokenService.verifyAccessToken(_token);
      userId = payload.userId;
    }
  } catch (_err) {
    // Token invalid or expired - still proceed with logout
    console.warn('[LOGOUT] Failed to extract userId from access token');
  }

  try {
    // Get refresh token for logout (needed to revoke in DB)
    const refreshToken = _req.cookies.get('refreshToken')?.value;
    const adminRefreshToken = _req.cookies.get('admin_refreshToken')?.value;
    const infraRefreshToken = _req.cookies.get('infra_refreshToken')?.value;

    // 🔥 CRITICAL: Pass userId to ensure ALL tokens are revoked
    if (typeof refreshToken === 'string' && refreshToken.trim() !== '') {
      await authService.logout(refreshToken, userId, ip, brand);
    } else if (typeof _token === 'string' && _token.trim() !== '') {
      // Fallback: Use access token if refresh token missing
      await authService.logout(_token, userId, ip, brand);
    }
    
    if (typeof adminRefreshToken === 'string' && adminRefreshToken.trim() !== '') {
      await authService.logout(adminRefreshToken, userId, ip, brand);
    } else if (typeof adminToken === 'string' && adminToken.trim() !== '') {
      await authService.logout(adminToken, userId, ip, brand);
    }
    
    if (typeof infraRefreshToken === 'string' && infraRefreshToken.trim() !== '') {
      await authService.logout(infraRefreshToken, userId, ip, brand);
    } else if (typeof infraToken === 'string' && infraToken.trim() !== '') {
      await authService.logout(infraToken, userId, ip, brand);
    }
  } catch (_err) {
    // Continue clearing cookies to avoid sticky sessions
    console.error('[AUTH_FLOW][LOGOUT][ERROR]', JSON.stringify({
      requestId,
      error: _err instanceof Error ? _err.message : 'Unknown error',
    }));
  }

  const response = ApiResponse.success({ message: 'Logged out' });

  const portalIdentity = _req.headers.get('x-portal-identity') ?? 'global';

  console.log('[AUTH_FLOW][LOGOUT][CLEARING_COOKIES]', JSON.stringify({
    requestId,
    portalIdentity,
    brand,
  }));

  // Use shared cookie middleware to clear cookies
  if (portalIdentity === 'infrastructure') {
    // Infrastructure uses special handling (keep existing logic for now)
    const cookieDomain = resolveCookieDomain(undefined, requestHostname);
    const clear = (name: string) => {
      response.cookies.set(name, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 0,
        path: '/',
        domain: cookieDomain,
      });
    };
    clear('infra_accessToken');
    clear('infra_refreshToken');
    clear('csrfToken');
  } else if (portalIdentity === 'admin') {
    clearAuthCookies(response, brand as Brand, true);
    response.cookies.set('csrfToken', '', { maxAge: 0, path: '/' });
  } else if (portalIdentity === 'user') {
    clearAuthCookies(response, brand as Brand, false);
    response.cookies.set('csrfToken', '', { maxAge: 0, path: '/' });
  } else {
    // Clear all cookies for global logout
    clearAuthCookies(response, brand as Brand, false);
    clearAuthCookies(response, brand as Brand, true);
    // Also clear infrastructure cookies
    const cookieDomain = resolveCookieDomain(undefined, requestHostname);
    const clear = (name: string) => {
      response.cookies.set(name, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 0,
        path: '/',
        domain: cookieDomain,
      });
    };
    clear('infra_accessToken');
    clear('infra_refreshToken');
    clear('csrfToken');
  }
  
  clearOnboardingStateCookie(response, _req);

  console.log('[AUTH_FLOW][LOGOUT][SUCCESS]', JSON.stringify({
    requestId,
    portalIdentity,
    brand,
  }));

  return response;
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const POST = withObservability(
  withCorrelationId(
    withLogging(handler, { component: 'auth', operation: 'logout' })
  )
);
