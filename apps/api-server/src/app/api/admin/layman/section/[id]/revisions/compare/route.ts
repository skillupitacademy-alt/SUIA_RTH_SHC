/**
 * Layman Section Revision Comparison API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * GET /api/admin/layman/section/:id/revisions/compare - Compare two revisions
 */

import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { LaymanRevisionService } from '@quiz/db-tutorial';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const dynamic = 'force-dynamic';

/**
 * Compare two revisions
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
    const fromRevision = parseInt(searchParams.get('from') || '0');
    const toRevision = parseInt(searchParams.get('to') || '0');
    
    if (!fromRevision || !toRevision) {
      return ApiResponse.error(
        badRequest('Missing required query parameters: from, to')
      );
    }
    
    // Compare revisions
    const revisionService = new LaymanRevisionService();
    const comparison = await revisionService.compareRevisions(
      sectionId,
      fromRevision,
      toRevision
    );
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.revisions.compare.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.revisions.compare.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      sectionId,
      comparison,
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.revisions.compare.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.revisions.compare.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withRateLimit(
  withCorrelationId(
    withLogging(getHandler, { 
      component: 'layman', 
      operation: 'compare_revisions' 
    })
  ),
  { limit: 100, windowMs: 60000, keyPrefix: 'ratelimit:layman:revisions:compare' }
);
