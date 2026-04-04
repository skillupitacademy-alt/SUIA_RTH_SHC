import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

async function handler(_request: NextRequest) {
  const start = Date.now();
  try {
    await requireAdminRouteAccess(_request);
    const { searchParams } = new URL(_request.url);
    const userId = searchParams.get('userId') ?? undefined;
    const range = searchParams.get('range') ?? '7d';

    if (!['7d', '14d', '28d', '90d'].includes(range)) {
      return ApiResponse.error(badRequest('Invalid range'), 400);
    }

    const skills = await TrendsService.getSkillTrends({ userId, range });
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.trends.skills.success', 1, { range });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.trends.skills.duration', durationMs, { outcome: 'success', range });
    
    return ApiResponse.success({ skills }, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.trends.skills.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.trends.skills.duration', durationMs, { outcome: 'failure' });
    
    return ApiResponse.error(_error);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'get_skill_trends' }));
