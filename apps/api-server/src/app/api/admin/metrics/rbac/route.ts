import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw new Error('Unauthorized');
    }
    return await TokenService.verifyAccessToken(_token, true);
}

async function handler(_req: NextRequest) {
    const start = Date.now();
    try {
        await _verifyAdmin(_req);
        const data = await AdminEngine.getRBACMetrics();
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.rbac', 1, { outcome: 'success' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.rbac.duration', durationMs, { outcome: 'success' });
        return NextResponse.json(data, {
            headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.rbac', 1, { outcome: 'failure' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.rbac.duration', durationMs, { outcome: 'failure' });
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_rbac_metrics' });
