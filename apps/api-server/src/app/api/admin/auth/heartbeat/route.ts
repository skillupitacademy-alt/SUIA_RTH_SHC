import { db, users } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') return ApiResponse.error(unauthorized('Unauthorized Admin'), 401);

    const _payload = await TokenService.verifyAccessToken(_token, true);
    
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, _payload.userId));

    const durationMs = Date.now() - start;
    recordCounter(METRICS.AUTH.LOGIN + '.heartbeat', 1, { outcome: 'success' });
    recordTimer(METRICS.AUTH.LOGIN + '.heartbeat.duration', durationMs);

    return ApiResponse.success({ status: 'ok', timestamp: new Date().toISOString(), mode: 'admin' });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    recordCounter(METRICS.AUTH.LOGIN + '.heartbeat', 1, { outcome: 'failure' });
    return ApiResponse.error(unauthorized(message), 401);
  }
}

export const POST = withLogging(handler, { component: 'admin-auth', operation: 'heartbeat' });
