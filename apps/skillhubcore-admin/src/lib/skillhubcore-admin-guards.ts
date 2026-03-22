import { NextResponse } from 'next/server';

import { TokenService, type SkillHubCoreTokenPayload } from '@quiz/auth';

export const REQUIRED_SUPER_ADMIN_ROLES = ['super_admin'];

export function getTokenFromRequest(request: Request): string | undefined {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)skillhubcore_accessToken=([^;]+)/);
  if (match?.[1] !== undefined) {
    return decodeURIComponent(match[1]);
  }

  const accessTokenMatch = cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
  return accessTokenMatch?.[1] !== undefined ? decodeURIComponent(accessTokenMatch[1]) : undefined;
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
