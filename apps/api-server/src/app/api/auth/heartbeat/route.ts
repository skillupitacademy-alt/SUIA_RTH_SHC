import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    
    // Update last active
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, payload.userId));

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
