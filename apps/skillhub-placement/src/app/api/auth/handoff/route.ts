import { NextResponse } from 'next/server';

type HandoffBody = {
  accessToken?: string;
  redirectTo?: string;
};

type CallbackValidationResponse = {
  skillhubToken?: string;
  refreshToken?: string;
  shadowUserId?: string;
};

const SKILLHUBCORE_CALLBACK_URL =
  process.env.SKILLHUBCORE_CALLBACK_URL?.trim() ||
  'https://api.skillhubcore.in/auth/callback/validate';

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

  const validationResponse = await fetch(SKILLHUBCORE_CALLBACK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-gateway-secret': process.env.INTERNAL_GATEWAY_SECRET ?? '',
    },
    body: JSON.stringify({ accessToken }),
    cache: 'no-store',
  });

  if (!validationResponse.ok) {
    return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
  }

  const payload = (await validationResponse.json().catch(() => null)) as CallbackValidationResponse | null;
  const skillhubToken = typeof payload?.skillhubToken === 'string' ? payload.skillhubToken.trim() : '';
  const refreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken.trim() : '';
  if (skillhubToken.length === 0 || refreshToken.length === 0) {
    return NextResponse.json({ error: 'Shared token exchange failed' }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: normalizeRedirectTo(body.redirectTo) });
  response.cookies.set('skillhubcore_accessToken', skillhubToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60,
    path: '/',
    domain: '.skillhubcore.in',
  });
  response.cookies.set('skillhubcore_refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    domain: '.skillhubcore.in',
  });

  return response;
}
