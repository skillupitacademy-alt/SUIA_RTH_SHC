import { NextResponse } from 'next/server';

const cookieNames = ['accessToken', 'admin_accessToken', 'refreshToken', 'admin_refreshToken'] as const;

export function setAdminSessionCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  for (const name of cookieNames) {
    response.cookies.set(name, name.includes('refresh') ? refreshToken : accessToken, {
      path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    });
  }
  // Append after ResponseCookies has serialized the host cookies: its name-keyed
  // map cannot represent two cookie scopes with the same name.
  for (const name of cookieNames) {
    response.headers.append('set-cookie', `${name}=; Path=/; Domain=.skillhubcore.in; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  }
}

export function clearAdminSessionCookies(response: NextResponse) {
  // Expire host-only cookies and the domain cookies issued by the previous login handler.
  for (const name of cookieNames) {
    for (const domain of [undefined, '.skillhubcore.in']) {
      response.headers.append('set-cookie', [
        `${name}=`, 'Path=/', domain ? `Domain=${domain}` : '',
        'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=0',
      ].filter(Boolean).join('; '));
    }
  }
}
