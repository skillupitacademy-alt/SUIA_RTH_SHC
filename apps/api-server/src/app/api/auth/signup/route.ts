import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';
import { signupSchema } from '@/schemas/auth.schemas';

export const dynamic = 'force-dynamic';

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
      _user: { id: _user.id, email: _user.email, name, onboarded: false },
      accessToken
    });

    // Set HttpOnly cookies for refresh _token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN ?? undefined,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    setCsrfToken(response);

    return response;
  } catch (_error: unknown) {
    console.error('Signup.Error:', _error);
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}
