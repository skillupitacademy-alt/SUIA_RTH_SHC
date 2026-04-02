import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { resolveCookieDomain } from '@/lib/cookie-domain';
import { resolveRequestBrandFromHeaders, resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

interface RefreshRequest {
  examId?: string;
}

async function handler(_req: NextRequest) {
  try {
    const portalIdentity = _req.headers.get('x-portal-identity') ?? 'user';
    const audience = portalIdentity === 'infrastructure' ? 'infra' : portalIdentity === 'admin' ? 'admin' : 'user';
    const requestBrand = resolveRequestBrandFromHeaders(_req.headers, _req.nextUrl.hostname);

    const infraRefresh = _req.cookies.get('infra_refreshToken')?.value;
    const adminRefresh = _req.cookies.get('admin_refreshToken')?.value;
    const userRefresh = _req.cookies.get('refreshToken')?.value;

    const tokenToUse = portalIdentity === 'infrastructure' ? infraRefresh : portalIdentity === 'admin' ? adminRefresh : userRefresh;
    
    if (tokenToUse === undefined || tokenToUse === null || tokenToUse === '') {
      return ApiResponse.error(badRequest(`No refresh token for scope: ${portalIdentity}`, 'UNAUTHORIZED'));
    }

    const cookieName = portalIdentity === 'infrastructure' ? 'infra_refreshToken' : portalIdentity === 'admin' ? 'admin_refreshToken' : 'refreshToken';

    const ip = getClientIp(_req);
    
    const rawBody = await _req.json().catch(() => ({}));
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as RefreshRequest;
    const examId = typeof body?.examId === 'string' && body.examId !== '' ? body.examId : undefined;

    const authService = container.get(AuthService);
    const tokenService = container.get(TokenService);

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(tokenToUse, ip, examId, audience, requestBrand);
    const expiresAt = tokenService.getExpiration(accessToken);

    let maxAge = 15 * 60; 
    if (expiresAt !== null) {
        const expTime = new Date(expiresAt).getTime();
        const now = Date.now();
        maxAge = Math.ceil((expTime - now) / 1000);
    }
    if (maxAge < 0) maxAge = 15 * 60; 

    const response = ApiResponse.success({ success: true, expiresAt });

    const requestHostname = resolveRequestHostnameFromHeaders(_req.headers, _req.nextUrl.hostname);
    const cookieDomain = resolveCookieDomain(undefined, requestHostname);

    const accessTokenCookieName = portalIdentity === 'infrastructure' ? 'infra_accessToken' : portalIdentity === 'admin' ? 'admin_accessToken' : 'accessToken';
    response.cookies.set(accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: maxAge, 
      path: '/',
      domain: cookieDomain,
    });

    response.cookies.set(cookieName, newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      domain: cookieDomain,
    });

    return response;
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 401);
  }
}

export const POST = withLogging(handler, { component: 'auth', operation: 'refresh_tokens' });
