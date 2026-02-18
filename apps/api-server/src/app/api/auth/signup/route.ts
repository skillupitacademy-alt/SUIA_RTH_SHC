import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';
import { signupSchema } from '@/schemas/auth.schemas';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'auth:signup' });

export async function POST(_req: NextRequest) {
  try {
    const rawBody = await _req.json();
    const parsed = signupSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const { email, password, name } = parsed.data;

    const _user = await AuthService.signup(email, password, name);

    // Auto-login after signup
    const { accessToken, refreshToken } = await AuthService.login(email, password);

    const response = NextResponse.json({
      message: 'User created',
      user: {
        id: _user.id, 
        email: _user.email, 
        name, 
        onboarded: false,
        role: 'user',
        isAdmin: false
      },
      accessToken
    });

    const rawDomain = process.env.COOKIE_DOMAIN;
    const cookieDomain = rawDomain === undefined || rawDomain === null || rawDomain === '' ? undefined : rawDomain;

    // Set HttpOnly cookies for Access Token
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: true, // Always true for cross-domain stability
      sameSite: 'none', // Needed for cross-subdomain (api.<->quiz/admin)
      maxAge: 15 * 60, // 15 minutes
      path: '/',
      domain: cookieDomain,
    });

    // Set HttpOnly cookies for Refresh Token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      domain: cookieDomain,
    });

    setCsrfToken(response);

    return response;
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    log.error({ error: message }, 'Signup failed');
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}
