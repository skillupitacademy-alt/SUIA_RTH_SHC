import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const { user, accessToken, refreshToken, isAdmin } = await AuthService.login(email, password);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email },
      accessToken,
    });

    const cookieName = isAdmin ? 'admin_refreshToken' : 'refreshToken';
    const domain = isAdmin 
      ? process.env.ADMIN_COOKIE_DOMAIN 
      : process.env.USER_COOKIE_DOMAIN;

    // Set HttpOnly cookies for refresh token
    response.cookies.set(cookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      domain: domain || undefined,
    });

    setCsrfToken(response);

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
