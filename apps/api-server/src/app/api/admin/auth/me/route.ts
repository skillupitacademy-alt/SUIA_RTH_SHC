import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';

import { TokenService } from '@/modules/auth/token.service';

export async function GET(_req: NextRequest) {
  try {
    // Strictly use Admin Scope
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);
    const _user = await db.query.users.findFirst({
      where: eq(users.id, _payload.userId),
      with: {
        profile: true,
        userRoles: {
          with: { role: true }
        }
      }
    });

    if (_user === null || _user === undefined) return NextResponse.json({ _error: 'User not found' }, { status: 404 });

    const role = _user.userRoles[0]?.role?.name?.toLowerCase() ?? 'user';
    const isAdmin = role === 'admin' || role === 'super_admin' || role === 'infrastructure';

    if (!isAdmin) {
        return NextResponse.json({ _error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: _user.id,
        email: _user.email,
        name: _user.profile?.name ?? 'Administrator',
        role,
        isAdmin
      },
      expiresAt: TokenService.getExpiration(_token)
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return NextResponse.json({ _error: message }, { status: 401 });
  }
}
