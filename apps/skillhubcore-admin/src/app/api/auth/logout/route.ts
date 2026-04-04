import { NextRequest, NextResponse } from 'next/server';

import { clearSkillHubCoreAuthCookies, resolveSkillHubCoreServiceUrl } from '@/lib/skillhubcore-auth-api';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('skillhubcore_refreshToken')?.value;

  if (typeof refreshToken === 'string' && refreshToken.length > 0) {
    await fetch(`${resolveSkillHubCoreServiceUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-gateway-secret': process.env.INTERNAL_GATEWAY_SECRET ?? '',
        'x-portal-identity': 'super_admin',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ success: true });
  clearSkillHubCoreAuthCookies(response);
  return response;
}
