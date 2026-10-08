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
        const data = await AdminAnalyticsEngine.getGrowthZones();
        const durationMs = Date.now() - start;
        
        recordCounter('admin.api.metrics.growth.count', 1, { outcome: 'success' });
        recordTimer('admin.api.metrics.growth.duration', durationMs, { outcome: 'success' });

        return ApiResponse.success(data, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (error: unknown) {
        recordCounter('admin.api.metrics.growth.count', 1, { outcome: 'failure' });
        return ApiResponse.error(error);
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_growth_metrics' });
