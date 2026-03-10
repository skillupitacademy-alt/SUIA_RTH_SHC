import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { bootstrapCQRS,GetLiveSessionsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw unauthorized('Unauthorized');
    }
    return await container.get(TokenService).verifyAdminAccessToken(_token);
}

async function handler(_req: NextRequest) {
    const start = Date.now();
    try {
        await _verifyAdmin(_req);
        
        bootstrapCQRS();
        const data = await queryBus.dispatch(new GetLiveSessionsQuery());
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.sessions.live.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.sessions.live.duration', durationMs, { outcome: 'success' });
        
        return ApiResponse.success(data, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.sessions.live.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.sessions.live.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(internalError(message), 500);
    }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'get_live_sessions' }));
