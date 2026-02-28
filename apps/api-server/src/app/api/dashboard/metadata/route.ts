import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
    const data = await DashboardEngine.getPerformanceBreakdownMetadata(_payload.userId);
    
    const durationMs = Date.now() - start;
    recordTimer('dashboard.api.metadata.duration', durationMs, { outcome: 'success' });
    recordCounter('dashboard.api.metadata.count', 1, { outcome: 'success' });

    return NextResponse.json(data, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter('dashboard.api.metadata.count', 1, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'dashboard', operation: 'get_metadata' });
