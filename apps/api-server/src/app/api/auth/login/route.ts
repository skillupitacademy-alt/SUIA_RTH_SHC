import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';

export const dynamic = 'force-dynamic';

interface LoginRequest {
  email?: string;
  password?: string;
}

export async function POST(_req: NextRequest) {
  try {
    const { email, password } = (await _req.json()) as LoginRequest;

    if (email === undefined || email === null || email === '' || password === undefined || password === null || password === '') {
      return NextResponse.json({ _error: 'Credentials required' }, { status: 400 });
    }

    const { _user, accessToken, refreshToken, isAdmin } = await AuthService.login(email, password);

    const onboarded = Boolean(
      (_user.profile?.professionalStatus !== undefined && _user.profile?.professionalStatus !== null && _user.profile?.professionalStatus !== '') && 
      (_user.profile?.educationLevel !== undefined && _user.profile?.educationLevel !== null && _user.profile?.educationLevel !== '')
    );

    const response = NextResponse.json({
      _user: { 
        id: _user.id, 
        email: _user.email,
        name: _user.profile?.name ?? 'User',
        onboarded,
        role: isAdmin === true ? 'admin' : '_user',
        isAdmin
      },
      // accessToken removed from body
    });

    const cookieDomain = process.env.COOKIE_DOMAIN ?? '.realtutorialhub.com';

    // Set HttpOnly cookies for Access Token
    const accessTokenCookieName = isAdmin === true ? 'admin_accessToken' : 'accessToken';
    response.cookies.set(accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: true, // Always true for cross-domain stability
      sameSite: 'none', // Needed for cross-subdomain (api.<->quiz/admin)
      maxAge: 15 * 60, // 15 minutes
      path: '/',
      domain: cookieDomain,
    });

    // Set HttpOnly cookies for Refresh Token
    const refreshCookieName = isAdmin === true ? 'admin_refreshToken' : 'refreshToken';
    const refreshMaxAge = isAdmin === true ? 24 * 60 * 60 : 7 * 24 * 60 * 60; // 24h for admin, 7d for _user
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
  } catch (_error: unknown) {
    return NextResponse.json({ _error: 'Invalid credentials' }, { status: 401 });
  }
}
