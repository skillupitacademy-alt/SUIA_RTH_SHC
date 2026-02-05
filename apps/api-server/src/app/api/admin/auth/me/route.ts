import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TokenService } from '@/modules/auth/token.service';
import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Strictly use Admin Scope
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, true);
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      with: {
        profile: true,
        userRoles: {
          with: { role: true }
        }
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const role = user.userRoles[0]?.role?.name?.toLowerCase() || 'user';
    const isAdmin = role === 'admin' || role === 'super_admin';

    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email,
        name: user.profile?.name || 'Admin',
        role,
        isAdmin
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
