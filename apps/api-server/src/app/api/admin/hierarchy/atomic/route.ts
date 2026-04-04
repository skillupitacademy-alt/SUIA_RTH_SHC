import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { HierarchyFactory } from "@/modules/domain/hierarchy.factory";

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
    const start = Date.now();
    try {
        await requireAdminRouteAccess(_req);
        const rawBody = await _req.json().catch(() => null);
        if (rawBody === null || !validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
            return ApiResponse.error(badRequest('Payload too deep or large'), 400);
        }
        const body = sanitizeJsonField(rawBody);
        const result = await HierarchyFactory.seedAtomic(body);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.duration', durationMs, { outcome: 'success' });
        
        return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.hierarchy.atomic.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(_error);
    }
}

export const POST = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'atomic_seed_hierarchy' }));
