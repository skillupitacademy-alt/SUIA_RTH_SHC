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
        const body = await _req.json();
        const result = await AdminEngine.atomicSeed(body);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.duration', durationMs, { outcome: 'success' });
        
        return NextResponse.json(result, {
            headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    } catch (_error: unknown) {
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.duration', durationMs, { outcome: 'failure' });
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'atomic_seed_hierarchy' });
