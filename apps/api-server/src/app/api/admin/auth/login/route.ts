import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recordCounter } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminAuthService } from '@/modules/auth/admin-auth.service';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function handler(_req: Request) {
  try {
    const body = await _req.json();
    const { email, password } = loginSchema.parse(body);

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

    const response = NextResponse.json({
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

  } catch (_error: unknown) {
    recordCounter('admin.auth.login', 1, { outcome: 'failure' });

    if (_error instanceof z.ZodError) {
      return NextResponse.json({ _error: 'Invalid input' }, { status: 400 });
    }
    
    const message = _error instanceof Error ? _error.message : 'Authentication failed';
    const status = message.includes('Locked') ? 403 : 401;
    return NextResponse.json({ _error: message }, { status });
  }
}

export const POST = withLogging(handler, { component: 'admin-auth', operation: 'login' });
