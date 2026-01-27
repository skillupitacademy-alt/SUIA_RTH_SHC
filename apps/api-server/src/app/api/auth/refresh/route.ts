import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    const adminToken = req.cookies.get('admin_refreshToken')?.value;
    
    if (!refreshToken && !adminToken) throw new Error('No refresh token');

    const tokenToUse = refreshToken || adminToken;
    const isAdmin = !!adminToken && !refreshToken; // Heuristic based on which cookie is present
    const cookieName = isAdmin ? 'admin_refreshToken' : 'refreshToken';

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || '';
    
    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(tokenToUse!, ip);

    const response = NextResponse.json({ accessToken });

    const domain = isAdmin 
      ? process.env.ADMIN_COOKIE_DOMAIN 
      : process.env.USER_COOKIE_DOMAIN;

    response.cookies.set(cookieName, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      domain: domain || undefined,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
