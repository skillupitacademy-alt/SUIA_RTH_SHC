import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const { user, accessToken, refreshToken, isAdmin } = await AuthService.login(email, password);

    const onboarded = !!(user.profile?.professionalStatus && user.profile?.educationLevel);

    const response = NextResponse.json({
      user: { 
        id: user.id, 
        email: user.email,
        name: user.profile?.name || 'User',
        onboarded,
        role: isAdmin ? 'admin' : 'user',
        isAdmin
      },
      // accessToken removed from body
    });

    const cookieDomain = process.env.COOKIE_DOMAIN || '.realtutorialhub.com';
    const isProd = process.env.NODE_ENV === 'production';

    // Set HttpOnly cookies for Access Token
    const accessTokenCookieName = isAdmin ? 'admin_accessToken' : 'accessToken';
    response.cookies.set(accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: true, // Always true for cross-domain stability
      sameSite: 'none', // Needed for api. subdomain to quiz. subdomain
      maxAge: 15 * 60, // 15 minutes
      path: '/',
      domain: cookieDomain,
    });

    // Set HttpOnly cookies for Refresh Token
    const refreshCookieName = isAdmin ? 'admin_refreshToken' : 'refreshToken';
    const refreshMaxAge = isAdmin ? 24 * 60 * 60 : 7 * 24 * 60 * 60; // 24h for admin, 7d for user
    response.cookies.set(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: refreshMaxAge, 
      path: '/',
      domain: cookieDomain,
    });

    setCsrfToken(response);

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
