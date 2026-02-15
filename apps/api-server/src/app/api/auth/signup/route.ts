import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';

export const dynamic = 'force-dynamic';

interface SignupRequest {
  email?: string;
  password?: string;
  name?: string;
}

export async function POST(_req: NextRequest) {
  try {
    const { email, password, name } = (await _req.json()) as SignupRequest;

    if (
      email === undefined || email === null || email === '' || email.trim() === '' || 
      password === undefined || password === null || password === '' || password.trim() === '' || 
      name === undefined || name === null || name === '' || name.trim() === ''
    ) {
      return NextResponse.json({ _error: 'Missing fields' }, { status: 400 });
    }

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
