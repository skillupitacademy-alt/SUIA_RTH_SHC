import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const startTime = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });

    await TokenService.verifyAccessToken(_token, true); // true for isAdmin check
    
    const metrics = await AdminEngine.getPlatformMetrics();
    
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD, 1, { outcome: 'success' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.duration', durationMs, { outcome: 'success' });
    
    return NextResponse.json(metrics, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD, 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.duration', Date.now() - startTime, { outcome: 'failure' });
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return NextResponse.json({ _error: message }, { status: 403 });
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_platform_metrics' });
