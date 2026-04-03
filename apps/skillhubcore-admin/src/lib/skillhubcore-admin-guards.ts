import { createHmac, timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

import { TokenService, type SkillHubCoreTokenPayload } from '@quiz/auth';

export const REQUIRED_SUPER_ADMIN_ROLES = ['super_admin'];
const TOTP_SESSION_TTL_SECONDS = 5 * 60;

export function getTokenFromRequest(request: Request): string | undefined {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)skillhubcore_accessToken=([^;]+)/);
  if (match?.[1] !== undefined) {
    return decodeURIComponent(match[1]);
  }
  return undefined;
}

function getTotpSessionSecret(): string {
  const secret = process.env.SKILLHUBCORE_ADMIN_TOTP_SECRET ?? process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('Missing TOTP session secret');
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signSessionPayload(payload: string): string {
  return createHmac('sha256', getTotpSessionSecret()).update(payload).digest('base64url');
}

type TotpSessionPayload = {
  sub: string;
  roles: string[];
  verified: true;
  exp: number;
};

export function createTotpSessionToken(user: SkillHubCoreTokenPayload): string {
  const payload: TotpSessionPayload = {
    sub: user.sub,
    roles: user.roles,
    verified: true,
    exp: Math.floor(Date.now() / 1000) + TOTP_SESSION_TTL_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signSessionPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyTotpSessionToken(sessionToken: string): TotpSessionPayload {
  const [encodedPayload, signature] = sessionToken.split('.');
  if (encodedPayload === undefined || signature === undefined) {
    throw new Error('Invalid TOTP session');
  }

  const expectedSignature = signSessionPayload(encodedPayload);
  const expected = Buffer.from(expectedSignature, 'utf8');
  const received = Buffer.from(signature, 'utf8');

  if (expected.length !== received.length || timingSafeEqual(expected, received) === false) {
    throw new Error('Invalid TOTP session');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<TotpSessionPayload>;
  if (
    payload.sub !== undefined &&
    typeof payload.sub === 'string' &&
    Array.isArray(payload.roles) &&
    payload.roles.every((role) => typeof role === 'string') &&
    payload.verified === true &&
    typeof payload.exp === 'number' &&
    payload.exp >= Math.floor(Date.now() / 1000)
  ) {
    return payload as TotpSessionPayload;
  }

  throw new Error('Expired TOTP session');
}

export async function requireSuperAdmin(request: Request): Promise<{ user: SkillHubCoreTokenPayload } | NextResponse> {
  const token = getTokenFromRequest(request);
  if (token === undefined || token.trim().length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await TokenService.verifySkillHubCoreJWT(token);
    const hasRole = user.roles.some((role) => REQUIRED_SUPER_ADMIN_ROLES.includes(role));
    if (hasRole === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return { user };
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export function requireTotp(request: Request): string | NextResponse {
  const totp = request.headers.get('x-totp-code') ?? request.headers.get('x-skillhubcore-totp');
  if (totp === null || totp.trim().length === 0) {
    return NextResponse.json({ error: 'TOTP required' }, { status: 428 });
  }

  return totp.trim();
}

export function getTotpSessionFromRequest(request: Request): string | undefined {
  const header = request.headers.get('x-totp-session') ?? request.headers.get('x-skillhubcore-totp-session');
  if (header !== null && header.trim().length > 0) {
    return header.trim();
  }

  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)skillhubcore_totp_session=([^;]+)/);
  return match?.[1] !== undefined ? decodeURIComponent(match[1]) : undefined;
}

export function requireTotpSession(request: Request): TotpSessionPayload | NextResponse {
  const sessionToken = getTotpSessionFromRequest(request);
  if (sessionToken === undefined || sessionToken.trim().length === 0) {
    return NextResponse.json({ error: 'TOTP session required' }, { status: 428 });
  }

  try {
    return verifyTotpSessionToken(sessionToken);
  } catch {
    return NextResponse.json({ error: 'TOTP session expired' }, { status: 401 });
  }
}
