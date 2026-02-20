import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AuthService } from '@/modules/auth/auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  const ip = _req.headers.get('x-forwarded-for') ?? '0.0.0.0';
  const _token = TokenService.getAccessToken(_req);
  const adminToken = _req.cookies.get('admin_accessToken')?.value;
  const infraToken = _req.cookies.get('infra_accessToken')?.value;

  if (typeof _token === 'string' && _token.trim() !== '') {
    await AuthService.logout(_token, undefined, ip);
  }
  if (typeof adminToken === 'string' && adminToken.trim() !== '') {
    await AuthService.logout(adminToken, undefined, ip);
  }
  if (typeof infraToken === 'string' && infraToken.trim() !== '') {
    await AuthService.logout(infraToken, undefined, ip);
  }

  const response = NextResponse.json({ message: 'Logged out' });
  const rawDomain = process.env.COOKIE_DOMAIN;
  const cookieDomain = rawDomain === undefined || rawDomain === null || rawDomain === '' ? undefined : rawDomain;

  const portalIdentity = _req.headers.get('x-portal-identity') ?? 'global';

  const clear = (name: string) => {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 0,
      path: '/',
      domain: cookieDomain,
    });
  };

  // Scoped Logout Logic: Only terminate the session of the requesting portal
  if (portalIdentity === 'infrastructure') {
      clear('infra_accessToken');
      clear('infra_refreshToken');
  } else if (portalIdentity === 'admin') {
      clear('admin_accessToken');
      clear('admin_refreshToken');
  } else if (portalIdentity === 'user') {
      clear('accessToken');
      clear('refreshToken');
  } else {
      // Global/Fallback behavior: Clear everything
      clear('accessToken');
      clear('refreshToken');
      clear('admin_accessToken');
      clear('admin_refreshToken');
      clear('infra_accessToken');
      clear('infra_refreshToken');
  }
  
  clear('csrfToken');

  return response;
}
