import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // ADMIN SCOPE Check
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (!token) return NextResponse.json({ error: 'Unauthorized Admin', scope: 'admin' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, true); // true = isAdmin check implicit in verify if needed, but we rely on scope extraction
    
    // Update last active
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, payload.userId));

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'admin' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
