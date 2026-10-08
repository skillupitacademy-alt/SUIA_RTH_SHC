import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { UsageService } from '@/modules/system/usage.service';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    await requireAdminRouteAccess(req);
    const usage = await UsageService.getAllUsage();
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(usage, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.duration', durationMs, { outcome: 'failure' });
    
    return ApiResponse.error(error);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'get_system_usage' }));
