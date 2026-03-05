import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw unauthorized('Unauthorized');
    }
    return await container.get(TokenService).verifyAccessToken(_token, true);
}

async function handler(_req: NextRequest) {
    const start = Date.now();
    try {
        await _verifyAdmin(_req);
        const data = await AdminEngine.getBlueprintMetrics();
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints', 1, { outcome: 'success' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.duration', durationMs, { outcome: 'success' });
        return ApiResponse.success(data, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints', 1, { outcome: 'failure' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(internalError(message), 500);
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_blueprint_metrics' });
