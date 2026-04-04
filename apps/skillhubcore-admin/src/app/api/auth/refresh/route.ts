import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@quiz/auth';

import { resolveSkillHubCoreServiceUrl, setSkillHubCoreAuthCookies } from '@/lib/skillhubcore-auth-api';

type RefreshResponseBody = {
  accessToken?: string;
  refreshToken?: string;
};

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('skillhubcore_refreshToken')?.value;
  if (refreshToken === undefined || refreshToken.trim().length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const upstreamResponse = await fetch(`${resolveSkillHubCoreServiceUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-gateway-secret': process.env.INTERNAL_GATEWAY_SECRET ?? '',
      'x-portal-identity': 'super_admin',
    },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  const payload = (await upstreamResponse.json().catch(() => null)) as RefreshResponseBody | null;
  if (!upstreamResponse.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: upstreamResponse.status });
  }

  const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';
  const nextRefreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken.trim() : '';
  if (accessToken.length === 0 || nextRefreshToken.length === 0) {
    return NextResponse.json({ error: 'Invalid refresh response' }, { status: 502 });
  }

  const expiresAt = TokenService.getExpiration(accessToken);
  const response = NextResponse.json({ success: true, expiresAt });
  setSkillHubCoreAuthCookies(response, accessToken, nextRefreshToken, expiresAt);
  return response;
}
