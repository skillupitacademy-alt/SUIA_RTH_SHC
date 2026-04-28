// 🔐 CRITICAL: Import shared cookie middleware to ensure correct domain per brand
import { type Brand as CookieBrand,setAuthCookies } from '@quiz/auth';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { resolveRequestBrandFromHeaders } from '@/lib/request-brand';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withObservability } from '@/middleware/observability.middleware';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

interface RefreshRequest {
  examId?: string;
}

async function handler(_req: NextRequest, obsCtx: { requestId: string }) {
  const { requestId } = obsCtx; // 🔥 Use observability context
  
  try {
    const portalIdentity = _req.headers.get('x-portal-identity') ?? 'user';
    const audience = portalIdentity === 'infrastructure' ? 'infra' : portalIdentity === 'admin' ? 'admin' : 'user';
    const requestBrand = resolveRequestBrandFromHeaders(_req.headers);

    console.log('[AUTH_FLOW][REFRESH][START]', JSON.stringify({
      requestId,
      portalIdentity,
      audience,
      requestBrand,
    }));

    const infraRefresh = _req.cookies.get('infra_refreshToken')?.value;
    const adminRefresh = _req.cookies.get('admin_refreshToken')?.value;
    const userRefresh = _req.cookies.get('refreshToken')?.value;

    const tokenToUse = portalIdentity === 'infrastructure' ? infraRefresh : portalIdentity === 'admin' ? adminRefresh : userRefresh;
    
    if (tokenToUse === undefined || tokenToUse === null || tokenToUse === '') {
      return ApiResponse.error(badRequest(`No refresh token for scope: ${portalIdentity}`, 'UNAUTHORIZED'));
    }

    const ip = getClientIp(_req);
    
    // 🔐 ENTERPRISE AUTH: Extract device context from request headers
    const deviceContext = {
      deviceId: _req.headers.get('x-device-id') ?? undefined,
      userAgent: _req.headers.get('user-agent') ?? undefined,
      deviceName: _req.headers.get('x-device-name') ?? undefined,
    };
    
    const rawBody = await _req.json().catch(() => ({}));
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as RefreshRequest;
    const examId = typeof body?.examId === 'string' && body.examId !== '' ? body.examId : undefined;

    const authService = container.get(AuthService);
    const tokenService = container.get(TokenService);

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(tokenToUse, ip, examId, audience, requestBrand, deviceContext);
    const expiresAt = tokenService.getExpiration(accessToken);

    let maxAge = 15 * 60; 
    if (expiresAt !== null) {
        const expTime = new Date(expiresAt).getTime();
        const now = Date.now();
        maxAge = Math.ceil((expTime - now) / 1000);
    }
    if (maxAge < 0) maxAge = 15 * 60; 

    const response = ApiResponse.success({ success: true, expiresAt });

    // 🔐 CRITICAL FIX: Use shared cookie middleware to ensure correct domain per brand
    const cookieBrand: CookieBrand = requestBrand === 'skillup' ? 'skillup' : 'realtutorialhub';
    
    // Build cookies with correct domain for the brand
    const isAdmin = portalIdentity === 'admin';
    const isInfra = portalIdentity === 'infrastructure';
    
    if (isInfra) {
      // Infrastructure tokens use special handling (not brand-specific)
      response.cookies.set('infra_accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: maxAge,
        path: '/',
      });
      response.cookies.set('infra_refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    } else {
      // User and admin tokens use brand-specific domains
      setAuthCookies(response, accessToken, newRefreshToken, cookieBrand, isAdmin);
      
      console.log('[AUTH_FLOW][REFRESH][COOKIES]', JSON.stringify({
        requestId,
        requestBrand,
        cookieBrand,
        portalIdentity,
        isAdmin,
      }));
    }

    console.log('[AUTH_FLOW][REFRESH][SUCCESS]', JSON.stringify({
      requestId,
      portalIdentity,
      requestBrand,
    }));

    return response;
  } catch (_error: unknown) {
    console.log('[AUTH_FLOW][REFRESH][ERROR]', JSON.stringify({
      requestId: obsCtx.requestId,
      error: _error instanceof Error ? _error.message : 'Unknown error',
    }));
    return ApiResponse.error(_error, 401);
  }
}

export const POST = withObservability(handler);
