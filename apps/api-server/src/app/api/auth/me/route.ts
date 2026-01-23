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
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
