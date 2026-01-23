import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const { user, accessToken, refreshToken } = await AuthService.login(email, password);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email },
      accessToken,
    });

    // Set HttpOnly cookies for refresh token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
