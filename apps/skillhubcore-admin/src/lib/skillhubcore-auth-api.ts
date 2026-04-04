import { NextResponse } from 'next/server';

const DEFAULT_SKILLHUBCORE_SERVICE_URL = 'https://api.skillhubcore.in';

export function resolveSkillHubCoreServiceUrl(): string {
  const rawValue =
    process.env.SKILLHUBCORE_URL?.trim() ||
    process.env.SKILLHUB_API_URL?.trim() ||
    DEFAULT_SKILLHUBCORE_SERVICE_URL;

  return rawValue.replace(/\/+$/, '');
}

export function getSkillHubCoreCookieDomain(): string | undefined {
  const explicit = process.env.COOKIE_DOMAIN_SKILLHUB?.trim() || process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();
  if (typeof explicit === 'string' && explicit.length > 0) {
    return explicit.startsWith('.') ? explicit : `.${explicit}`;
  }

  return '.skillhubcore.in';
}

export function setSkillHubCoreAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresAt?: string | null,
) {
  const maxAge = expiresAt
    ? Math.max(60, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))
    : 15 * 60;

  const domain = getSkillHubCoreCookieDomain();

  response.cookies.set('skillhubcore_accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge,
    path: '/',
    domain,
  });

  response.cookies.set('skillhubcore_refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    domain,
  });
}

export function clearSkillHubCoreAuthCookies(response: NextResponse) {
  const domain = getSkillHubCoreCookieDomain();

  response.cookies.set('skillhubcore_accessToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    path: '/',
    domain,
  });

  response.cookies.set('skillhubcore_refreshToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    path: '/',
    domain,
  });
}
