import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminAnalyticsEngine } from "@/modules/admin-engine/admin.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw unauthorized('Unauthorized');
    }
    return await container.get(TokenService).verifyAdminAccessToken(_token);
}

async function handler(req: NextRequest) {
    const start = Date.now();
    try {
        await _verifyAdmin(req);
        const searchParams = req.nextUrl.searchParams;
        const range = searchParams.get('range') ?? '7d';

        const data = await AdminAnalyticsEngine.getPerformanceAnalytics(range);
        const durationMs = Date.now() - start;
        
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.performance', 1, { outcome: 'success', range });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.performance.duration', durationMs, { outcome: 'success', range });

        return ApiResponse.success(data, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (error: unknown) {
        const durationMs = Date.now() - start;
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.performance', 1, { outcome: 'failure' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.performance.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(internalError(`Internal Server Error: ${message}`), 500);
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_performance_metrics' });
