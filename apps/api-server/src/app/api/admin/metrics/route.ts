import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS, GetPlatformMetricsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

bootstrapCQRS(); // Ensure handlers are registered

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const startTime = Date.now();
  try {
    await requireAdminRouteAccess(_req);
    
    const metrics = await queryBus.dispatch(new GetPlatformMetricsQuery());
    
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD, 1, { outcome: 'success' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(metrics, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD, 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.duration', Date.now() - startTime, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'get_platform_metrics' }));
