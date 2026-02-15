import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req);
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: '_user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const _user = await db.query.users.findFirst({
      where: eq(users.id, _payload.userId),
      with: {
        profile: true,
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!_user) return NextResponse.json({ _error: 'User not found' }, { status: 404 });

    const onboarded = typeof _user.profile?.professionalStatus === 'string' && 
                      _user.profile.professionalStatus !== '' && 
                      typeof _user.profile?.educationLevel === 'string' && 
                      _user.profile.educationLevel !== '';

    return NextResponse.json({
      user: {
        id: _user.id,
        email: _user.email,
        name: _user.profile?.name,
        onboarded,
        professionalStatus: _user.profile?.professionalStatus ?? null,
        educationLevel: _user.profile?.educationLevel ?? null,
        roles: _user.userRoles.map((ur) => ur.role.name),
      },
      expiresAt: TokenService.getExpiration(_token),
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return NextResponse.json({ _error: message }, { status: 401 });
  }
}
