import { type NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { resolveCookieDomain } from '@/lib/cookie-domain';
import { resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { clearOnboardingStateCookie } from '@/modules/auth/onboarding-state-cookie';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const ip = getClientIp(_req);
  const tokenService = container.get(TokenService);
  const authService = container.get(AuthService);

  const _token = tokenService.getAccessToken(_req, { scope: 'user' });
  const adminToken = _req.cookies.get('admin_accessToken')?.value;
  const infraToken = _req.cookies.get('infra_accessToken')?.value;

  // ✅ Extract brand from request (hostname or header)
  const requestHostname = resolveRequestHostnameFromHeaders(_req.headers, _req.nextUrl.hostname);
  const brand: 'skillup' | 'realtutorialhub' = requestHostname?.includes('skillup') ? 'skillup' : 'realtutorialhub';

  try {
    if (typeof _token === 'string' && _token.trim() !== '') {
      await authService.logout(_token, undefined, ip, brand);
    }
    if (typeof adminToken === 'string' && adminToken.trim() !== '') {
      await authService.logout(adminToken, undefined, ip, brand);
    }
    if (typeof infraToken === 'string' && infraToken.trim() !== '') {
      await authService.logout(infraToken, undefined, ip, brand);
    }
  } catch (_err) {
    // Continue clearing cookies to avoid sticky sessions
  }

  const response = ApiResponse.success({ message: 'Logged out' });
  const cookieDomain = resolveCookieDomain(undefined, requestHostname);

  const portalIdentity = _req.headers.get('x-portal-identity') ?? 'global';

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

  if (portalIdentity === 'infrastructure') {
      clear('infra_accessToken');
      clear('infra_refreshToken');
  } else if (portalIdentity === 'admin') {
      clear('admin_accessToken');
      clear('admin_refreshToken');
  } else if (portalIdentity === 'user') {
      clear('accessToken');
      clear('refreshToken');
  } else {
      clear('accessToken');
      clear('refreshToken');
      clear('admin_accessToken');
      clear('admin_refreshToken');
      clear('infra_accessToken');
      clear('infra_refreshToken');
  }
  
  clear('csrfToken');
  clearOnboardingStateCookie(response, _req);

  return response;
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const POST = withCorrelationId(withLogging(handler, { component: 'auth', operation: 'logout' }));
