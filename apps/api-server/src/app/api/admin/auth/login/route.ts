import { z } from 'zod';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withApiHandler } from '@/lib/api-wrapper';
import { resolveCookieDomain } from '@/lib/cookie-domain';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter } from '@/lib/metrics';
import { resolveRequestBrand, resolveRequestBrandFromHeaders, resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { AdminAuthService } from '@/modules/auth/admin-auth.service';
import { getClientIp } from '@/modules/auth/client-ip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function handler(_req: Request, body: z.infer<typeof loginSchema>) {
  const { email, password } = body;
  const requestId = _req.headers.get('x-request-id') ?? 'no-request-id';
  const origin = _req.headers.get('origin') ?? 'unknown';
  const host = _req.headers.get('host') ?? new URL(_req.url).hostname;
  console.log('[AUTH_FLOW][ADMIN_LOGIN][START]', JSON.stringify({
    requestId,
    host,
    origin,
    path: new URL(_req.url).pathname,
  }));

  const ip = getClientIp({
    headers: _req.headers,
  });
  const portalIdentity = _req.headers.get('x-portal-identity') ?? 'admin';
  const audience = portalIdentity === 'infrastructure' ? 'infra' : 'admin';
  const bodyBrand = typeof (body as { platform?: string }).platform === 'string'
    ? (body as { platform?: string }).platform?.trim().toLowerCase()
    : undefined;
  const brand = resolveRequestBrand(bodyBrand) ?? resolveRequestBrandFromHeaders(_req.headers);
  if (brand !== 'skillup' && brand !== 'realtutorialhub') {
    throw badRequest('Brand is required');
  }
  
  const result = await AdminAuthService.login(email, password, ip, audience, brand);

  const requestHostname = resolveRequestHostnameFromHeaders(_req.headers, _req.url ? new URL(_req.url).hostname : undefined);
  const cookieDomain = resolveCookieDomain(undefined, requestHostname);
  console.log('[AUTH_FLOW][ADMIN_LOGIN][COOKIES]', JSON.stringify({
    requestId,
    host,
    cookieDomain: cookieDomain ?? 'unset',
    accessTokenCookieName: audience === 'infra' ? 'infra_accessToken' : 'admin_accessToken',
    refreshTokenCookieName: audience === 'infra' ? 'infra_refreshToken' : 'admin_refreshToken',
    sameSite: 'none',
    secure: true,
  }));

  const user = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      isAdmin: true,
      role: result.user.role ?? 'admin',
  };

  const response = ApiResponse.success({
      user,
      expiresAt: result.expiresAt,
  });

  const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
      domain: cookieDomain,
  };

  const accessTokenName = audience === 'infra' ? 'infra_accessToken' : 'admin_accessToken';
  const refreshTokenName = audience === 'infra' ? 'infra_refreshToken' : 'admin_refreshToken';

  response.cookies.set(accessTokenName, result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60,
  });

  response.cookies.set(refreshTokenName, result.refreshToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60,
  });

  const { setCsrfToken } = await import('@/modules/auth/csrf.middleware');
  setCsrfToken(response, requestHostname);

  recordCounter('admin.auth.login', 1, { outcome: 'success', audience });

  console.log('[AUTH_FLOW][ADMIN_LOGIN][SUCCESS]', JSON.stringify({
    requestId,
    host,
    audience,
    path: new URL(_req.url).pathname,
    cookieDomain: cookieDomain ?? 'unset',
    brand: brand ?? 'unknown',
  }));

  return response;
}

export const POST = withCorrelationId(withApiHandler(handler, { 
  schema: loginSchema,
  component: 'admin-auth', 
  operation: 'login' 
}));
