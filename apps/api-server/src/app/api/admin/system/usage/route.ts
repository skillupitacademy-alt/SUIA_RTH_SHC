import { METRICS } from '@quiz/observability';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { UsageService } from '@/modules/system/usage.service';

export const dynamic = 'force-dynamic';

async function handler() {
  const start = Date.now();
  try {
    const usage = await UsageService.getAllUsage();
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.duration', durationMs, { outcome: 'success' });
    
    return NextResponse.json(usage, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.duration', durationMs, { outcome: 'failure' });
    
    return NextResponse.json(
      { _error: 'Failed to fetch system usage', message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_system_usage' });
