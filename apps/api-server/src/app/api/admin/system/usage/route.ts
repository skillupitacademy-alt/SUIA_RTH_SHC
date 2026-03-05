import { METRICS } from '@quiz/observability';

import { internalError } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { UsageService } from '@/modules/system/usage.service';

export const dynamic = 'force-dynamic';

async function handler() {
  const start = Date.now();
  try {
    const usage = await UsageService.getAllUsage();
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(usage, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.system.usage.duration', durationMs, { outcome: 'failure' });
    
    return ApiResponse.error(internalError(`Failed to fetch system usage: ${message}`), 500);
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_system_usage' });
