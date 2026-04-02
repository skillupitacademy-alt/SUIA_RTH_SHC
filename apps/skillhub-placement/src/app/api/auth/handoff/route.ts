import { NextResponse } from 'next/server';

import { TokenService } from '@quiz/auth';

type HandoffBody = {
  accessToken?: string;
  redirectTo?: string;
};

function normalizeRedirectTo(rawValue: unknown): string {
  if (typeof rawValue === 'string' && rawValue.startsWith('/') && rawValue.startsWith('//') === false) {
    return rawValue;
  }

  return '/profile';
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as HandoffBody;
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';

  if (accessToken.length === 0) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
  }

  try {
    await TokenService.verifyUserAccessToken(accessToken, { audience: 'user' });
  } catch {
    return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
  }

  const expiresAt = TokenService.getExpiration(accessToken);
  let maxAge = 15 * 60;
  if (expiresAt !== null) {
    const deltaSeconds = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
    if (deltaSeconds > 0) {
      maxAge = deltaSeconds;
    }
  }

  const response = NextResponse.json({ ok: true, redirectTo: normalizeRedirectTo(body.redirectTo) });
  response.cookies.set('skillhubcore_accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge,
    path: '/',
    domain: '.skillhubcore.in',
  });

  return response;
}
