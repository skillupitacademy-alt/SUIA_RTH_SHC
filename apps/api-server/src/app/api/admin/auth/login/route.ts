import { z } from 'zod';

import { ApiResponse } from '@/lib/api-response';
import { withApiHandler } from '@/lib/api-wrapper';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter } from '@/lib/metrics';
import { AdminAuthService } from '@/modules/auth/admin-auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function handler(_req: Request, body: z.infer<typeof loginSchema>) {
  const { email, password } = body;

  const ip = _req.headers.get('x-forwarded-for') ?? '';
  const portalIdentity = _req.headers.get('x-portal-identity') ?? 'admin';
  const audience = portalIdentity === 'infrastructure' ? 'infra' : 'admin';
  
  const result = await AdminAuthService.login(email, password, ip, audience);

  const rawDomain = process.env.COOKIE_DOMAIN;
  const cookieDomain = rawDomain === undefined || rawDomain === null || rawDomain === '' ? undefined : rawDomain;

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
  setCsrfToken(response);

  recordCounter('admin.auth.login', 1, { outcome: 'success', audience });

  return response;
}

export const POST = withCorrelationId(withApiHandler(handler, { 
  schema: loginSchema,
  component: 'admin-auth', 
  operation: 'login' 
}));
