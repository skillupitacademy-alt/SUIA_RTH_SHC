import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@quiz/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('skillhubcore_accessToken')?.value;
  if (token === undefined || token.trim().length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await TokenService.verifySkillHubCoreJWT(token);
    const hasAllowedRole = payload.roles.includes('admin') || payload.roles.includes('super_admin');
    if (hasAllowedRole === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: payload.shadowUserId ?? payload.sub,
        shadowUserId: payload.shadowUserId ?? payload.sub,
        originalUserId: payload.originalUserId ?? payload.sub,
        roles: payload.roles,
        platforms: payload.platforms ?? [],
        subscriptions: payload.subscriptions,
      },
      expiresAt: TokenService.getExpiration(token),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
