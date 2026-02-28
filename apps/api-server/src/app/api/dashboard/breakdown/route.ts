import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CacheManager } from '@/lib/cache-manager';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    
    const range = _req.nextUrl.searchParams.get('range') ?? '28d';
    const validRanges = ['7d', '14d', '28d', '90d'];
    if (!validRanges.includes(range)) {
        return NextResponse.json({ _error: 'Invalid range parameter' }, { status: 400 });
    }

    // Use specialized breakdown cache
    const cached = CacheManager.getBreakdown(_payload.userId, range);
    if (cached !== null && cached !== undefined) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT', 'X-Duration-Ms': (Date.now() - start).toString() }
      });
    }

    const data = await DashboardEngine.getPerformanceBreakdown(_payload.userId, range);
    
    const durationMs = Date.now() - start;
    CacheManager.setBreakdown(_payload.userId, range, data);

    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.breakdown.duration', durationMs, { outcome: 'success', range });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.breakdown.success', 1, { range });

    return NextResponse.json(data, {
        headers: { 'X-Cache': 'MISS', 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.breakdown.failure', 1);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'dashboard', operation: 'get_breakdown' });
