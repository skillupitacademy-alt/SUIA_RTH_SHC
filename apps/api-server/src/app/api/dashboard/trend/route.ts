import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CacheManager } from '@/lib/cache-manager';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    
    const range = _req.nextUrl.searchParams.get('range') ?? '7d';
    const validRanges = ['7d', '14d', '28d', '90d'];
    if (!validRanges.includes(range)) {
        return NextResponse.json({ _error: 'Invalid range parameter' }, { status: 400 });
    }

    // Check Cache
    const cached = await CacheManager.getTrend(_payload.userId, range); 
    if (cached !== null && cached !== undefined) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT', 'X-Duration-Ms': (Date.now() - start).toString() }
      });
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

    return NextResponse.json(mergedData, {
        headers: { 'X-Cache': 'MISS', 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.trend.failure', 1);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'dashboard', operation: 'get_trend' });
