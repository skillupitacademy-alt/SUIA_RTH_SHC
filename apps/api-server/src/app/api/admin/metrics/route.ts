import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { forbidden, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminAnalyticsEngine } from "@/modules/admin-engine/admin.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const startTime = Date.now();
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') return ApiResponse.error(unauthorized('Unauthorized'), 401);

    await container.get(TokenService).verifyAdminAccessToken(_token); // true for isAdmin check
    
    const metrics = await AdminAnalyticsEngine.getPlatformMetrics();
    
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD, 1, { outcome: 'success' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(metrics, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD, 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.duration', Date.now() - startTime, { outcome: 'failure' });
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return ApiResponse.error(forbidden(message), 403);
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_platform_metrics' });
