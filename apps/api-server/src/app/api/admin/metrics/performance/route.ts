import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(req: NextRequest) {
    const _token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw new Error('Unauthorized');
    }
    return await TokenService.verifyAccessToken(_token, true);
}

async function handler(req: NextRequest) {
    const start = Date.now();
    try {
        await _verifyAdmin(req);
        const searchParams = req.nextUrl.searchParams;
        const range = searchParams.get('range') ?? '7d';

        const data = await AdminEngine.getPerformanceAnalytics(range);
        const durationMs = Date.now() - start;
        
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.performance', 1, { outcome: 'success', range });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.performance.duration', durationMs, { outcome: 'success', range });

        return NextResponse.json(data, {
            headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    } catch (error: unknown) {
        const durationMs = Date.now() - start;
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.performance', 1, { outcome: 'failure' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.performance.duration', durationMs, { outcome: 'failure' });
        return NextResponse.json({ _error: 'Internal Server Error', details: message }, { status: 500 });
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_performance_metrics' });
