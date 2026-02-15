import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req);
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: '_user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    
    // Update last active
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, _payload.userId));

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return NextResponse.json({ _error: message }, { status: 401 });
  }
}
