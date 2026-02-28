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

async function handler(req: NextRequest) {
    const start = Date.now();
    try {
        await _verifyAdmin(req);
        const data = await AdminEngine.getSecuritySignals();
        const durationMs = Date.now() - start;
        
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.security', 1, { outcome: 'success' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.security.duration', durationMs, { outcome: 'success' });

        return NextResponse.json(data, {
            headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    } catch (error: unknown) {
        const durationMs = Date.now() - start;
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.security', 1, { outcome: 'failure' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.security.duration', durationMs, { outcome: 'failure' });
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_security_signals' });
