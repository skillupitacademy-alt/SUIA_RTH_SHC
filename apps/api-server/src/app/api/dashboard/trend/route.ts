import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { CacheManager } from '@/lib/cache-manager';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return ApiResponse.error(unauthorized('Unauthorized'), 401);
    }

    const _payload = await container.get(TokenService).verifyUserAccessToken(_token);
    
    const range = _req.nextUrl.searchParams.get('range') ?? '7d';
    const validRanges = ['7d', '14d', '28d', '90d'];
    if (!validRanges.includes(range)) {
        return ApiResponse.error(badRequest('Invalid range parameter'), 400);
    }

    // Check Cache
    const cached = await CacheManager.getTrend(_payload.userId, range); 
    if (cached !== null && cached !== undefined) {
      return ApiResponse.success(cached, 200, { 'X-Cache': 'HIT', 'X-Duration-Ms': (Date.now() - start).toString() });
    }

    // Parallel Fetch: Core Trend + Time Machine Delta
    const [trendData, deltaData] = await Promise.all([
        DashboardEngine.getPerformanceTrend(_payload.userId, range),
        TrendsService.getPeriodDelta(_payload.userId, range)
    ]);

    // Compute Health
    const healthStatus = TrendsService.getExecHealth(trendData.averageScore, deltaData?.deltaPct ?? null);

    const mergedData = {
        ...trendData,
        currentAvg: deltaData?.currentAvg ?? null,
        previousAvg: deltaData?.previousAvg ?? null,
        deltaPct: deltaData?.deltaPct ?? null,
        healthStatus
    };
    
    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.trend.duration', durationMs, { outcome: 'success', range });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.trend.success', 1, { range });

    return ApiResponse.success(mergedData, 200, { 'X-Cache': 'MISS', 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.trend.failure', 1);
    return ApiResponse.error(internalError(message), 500);
  }
}

export const GET = withLogging(handler, { component: 'dashboard', operation: 'get_trend' });
