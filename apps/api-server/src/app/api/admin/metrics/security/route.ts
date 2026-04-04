import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminAnalyticsEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
    const start = Date.now();
    try {
        await requireAdminRouteAccess(req);
        const data = await AdminAnalyticsEngine.getSecuritySignals();
        const durationMs = Date.now() - start;
        
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.security', 1, { outcome: 'success' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.security.duration', durationMs, { outcome: 'success' });

        return ApiResponse.success(data, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (error: unknown) {
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.security', 1, { outcome: 'failure' });
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.security.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(error);
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_security_signals' });
