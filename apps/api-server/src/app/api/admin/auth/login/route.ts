export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AdminAuthService } from '@/modules/auth/admin-auth.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(_req: Request) {
  try {
    const body = await _req.json();
    const { email, password } = loginSchema.parse(body);

    const ip = _req.headers.get('x-forwarded-for') ?? '';
    
    const result = await AdminAuthService.login(email, password, ip);

    // Set Cookies
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

    // Sync settings with unified student/admin login for maximum stability
    const cookieOptions = {
        httpOnly: true,
        secure: true, // Always true for cross-domain stability in live env
        sameSite: 'none' as const,
        path: '/',
        domain: cookieDomain,
    };

    response.cookies.set('admin_accessToken', result.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60,
    });

    response.cookies.set('admin_refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60, // 24 hours
    });

    // SECURITY: Ensure CSRF token is issued upon administrative login
    const { setCsrfToken } = await import('@/modules/auth/csrf.middleware');
    setCsrfToken(response);

    return response;

  } catch (_error: unknown) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json({ _error: 'Invalid input' }, { status: 400 });
    }
    
    // Return 401 for all auth failures to prevent enumeration, unless it's a specific logic _error
    const message = _error instanceof Error ? _error.message : 'Authentication failed';
    const status = message.includes('Locked') ? 403 : 401;
    return NextResponse.json({ _error: message }, { status });
  }
}
