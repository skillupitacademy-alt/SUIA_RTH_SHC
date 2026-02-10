import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      with: {
        profile: true,
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.profile?.name,
        roles: user.userRoles.map((ur) => ur.role.name),
      },
      expiresAt: TokenService.getExpiration(token),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
