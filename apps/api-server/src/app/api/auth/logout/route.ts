import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  const ip = _req.headers.get('x-forwarded-for') ?? '0.0.0.0';
  const _token = TokenService.getAccessToken(_req);
  const adminToken = _req.cookies.get('admin_accessToken')?.value;

  if (typeof _token === 'string' && _token.trim() !== '') {
    await AuthService.logout(_token, undefined, ip);
  }
  if (typeof adminToken === 'string' && adminToken.trim() !== '') {
    await AuthService.logout(adminToken, undefined, ip);
  }

  const response = NextResponse.json({ message: 'Logged out' });
  const cookieDomain = process.env.COOKIE_DOMAIN ?? undefined;
  
  const options = { path: '/', domain: cookieDomain };
  response.cookies.delete({ name: 'accessToken', ...options });
  response.cookies.delete({ name: 'refreshToken', ...options });
  response.cookies.delete({ name: 'admin_accessToken', ...options });
  response.cookies.delete({ name: 'admin_refreshToken', ...options });
  
  return response;
}
