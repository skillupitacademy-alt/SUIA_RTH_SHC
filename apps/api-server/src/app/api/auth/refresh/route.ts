import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (!refreshToken) throw new Error('No refresh token');

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    
    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(refreshToken, ip);

    const response = NextResponse.json({ accessToken });

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
