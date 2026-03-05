import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req);
    if (typeof _token !== 'string' || _token.trim() === '') {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, _payload.userId));

    return ApiResponse.success({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 401);
  }
}

export const POST = withLogging(handler, { component: 'auth', operation: 'heartbeat' });
