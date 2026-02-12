import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    // ADMIN SCOPE Check
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') return NextResponse.json({ _error: 'Unauthorized Admin', scope: 'admin' }, { status: 401 });

    const _payload = await TokenService.verifyAccessToken(_token, true); // true = isAdmin check implicit in verify if needed, but we rely on scope extraction
    
    // Update last active
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, _payload.userId));

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'admin' });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return NextResponse.json({ _error: message }, { status: 401 });
  }
}
