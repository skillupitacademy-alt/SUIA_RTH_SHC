import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
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
        const rawBody = await _req.json().catch(() => null);
        if (rawBody === null || !validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
            return ApiResponse.error(badRequest('Payload too deep or large'), 400);
        }
        const body = sanitizeJsonField(rawBody);
        const result = await AdminEngine.atomicSeed(body);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.duration', durationMs, { outcome: 'success' });
        
        return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.duration', durationMs, { outcome: 'failure' });
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return ApiResponse.error(internalError(message), 500);
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'atomic_seed_hierarchy' });
