import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

async function handler(_request: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(_request.url);
    const range = searchParams.get('range') ?? '7d';

    if (!['7d', '14d', '28d', '90d'].includes(range)) {
      return NextResponse.json({ _error: 'Invalid range' }, { status: 400 });
    }

    const summary = await TrendsService.getTrendSummary({ range });
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.trends.summary.success', 1, { range });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.trends.summary.duration', durationMs, { outcome: 'success', range });
    
    return NextResponse.json(summary, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.trends.summary.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.trends.summary.duration', durationMs, { outcome: 'failure' });
    
    return NextResponse.json(
      { _error: 'Failed to fetch trend summary', message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_trend_summary' });
