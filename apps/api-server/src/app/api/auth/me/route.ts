import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TokenService } from '@/modules/auth/token.service';
import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
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

    const onboarded = !!(user.profile?.professionalStatus && user.profile?.educationLevel);

    const role = user.userRoles[0]?.role?.name?.toLowerCase() || 'user';
    const isAdmin = role === 'admin' || role === 'super_admin';

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email,
        name: user.profile?.name || 'User',
        onboarded,
        role,
        isAdmin
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
