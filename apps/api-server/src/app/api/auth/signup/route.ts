import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await AuthService.signup(email, password, name);

    // Auto-login after signup
    const { accessToken, refreshToken } = await AuthService.login(email, password);

    const response = NextResponse.json({ 
      message: 'User created', 
      user: { id: user.id, email: user.email, name },
      accessToken
    });

    // Set HttpOnly cookies for refresh token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    setCsrfToken(response);

    return response;
  } catch (error: any) {
    console.error('[SIGNUP ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
