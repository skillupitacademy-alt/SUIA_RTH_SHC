/**
 * Layman Section Revisions API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * GET /api/admin/layman/section/:id/revisions - Get revision history
 */

import { LaymanRevisionService } from '@quiz/db-tutorial';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { withRateLimit } from '@/middleware/rate-limit.middleware';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

/**
 * Get revision history for section
 */
async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    await requireAdminRouteAccess(req);
    
    const { id: sectionId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = parseInt((limitParam !== null && limitParam !== '') ? limitParam : '50');
    
    // Get revision history
    const revisionService = new LaymanRevisionService();
    const revisions = await revisionService.getRevisionHistory(sectionId, limit);
    const statistics = await revisionService.getRevisionStatistics(sectionId);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.revisions.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.revisions.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      sectionId,
      revisions,
      statistics,
      total: revisions.length,
      limit,
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.revisions.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.revisions.get.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withRateLimit(
  withCorrelationId(
    withLogging(getHandler, { 
      component: 'layman', 
      operation: 'get_revisions' 
    })
  ),
  { limit: 100, windowMs: 60000, keyPrefix: 'ratelimit:layman:revisions:get' }
);
