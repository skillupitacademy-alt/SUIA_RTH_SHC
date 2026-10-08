import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS,GetLiveSessionsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
    const start = Date.now();
    try {
        await requireAdminRouteAccess(_req);
        
        const searchParams = _req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') ?? '1', 10);
        const limit = parseInt(searchParams.get('limit') ?? '20', 10);
        const search = searchParams.get('search') ?? undefined;
        const fields = searchParams.get('fields') ?? undefined;

        bootstrapCQRS();
        const data = await queryBus.dispatch(new GetLiveSessionsQuery(page, limit, search, fields));
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.sessions.live.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.sessions.live.duration', durationMs, { outcome: 'success' });
        
        return ApiResponse.success(data, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.sessions.live.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.sessions.live.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(_error);
    }
}

export const GET = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'get_live_sessions' }));
