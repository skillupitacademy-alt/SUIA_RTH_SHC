/**
 * Layman Review Queue API
 * Phase 2B Week 3 - Controller Layer (Missing 10% Implementation)
 * ----------------------------------------------------------------
 * GET /api/admin/layman/review/queue - Get sections pending review
 */

import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { LaymanService } from '@quiz/db-tutorial';

import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const dynamic = 'force-dynamic';

/**
 * Get sections pending review
 * Returns sections in 'draft' or 'in_review' status
 */
async function getHandler(req: NextRequest) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    await requireAdminRouteAccess(req);
    
    const searchParams = req.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');
    
    // Query sections pending review
    const laymanService = new LaymanService();
    
    // Get draft sections
    const draftFilters: any = { status: 'draft' };
    if (brandId) {
      draftFilters.brandId = brandId;
    }
    const draftSections = await laymanService.queryLaymanSections(draftFilters);
    
    // Get in_review sections
    const reviewFilters: any = { status: 'in_review' };
    if (brandId) {
      reviewFilters.brandId = brandId;
    }
    const reviewSections = await laymanService.queryLaymanSections(reviewFilters);
    
    // Combine and sort by updatedAt (most recent first)
    const allPendingSections = [...draftSections, ...reviewSections].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    
    // Enrich with statistics
    const enrichedSections = await Promise.all(
      allPendingSections.map(async (section) => {
        const stats = await laymanService.getSectionStatistics(section.id);
        return {
          id: section.id,
          subtopicId: section.subtopicId,
          brandId: section.brandId,
          status: section.status,
          version: section.version,
          sectionType: section.sectionType,
          difficulty: section.difficulty,
          educationalArchitecture: section.educationalArchitecture,
          uiArchitecture: section.uiArchitecture,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
          publishedAt: section.publishedAt,
          approvedBy: section.approvedBy,
          approvedAt: section.approvedAt,
          generatedByAi: section.generatedByAi,
          statistics: stats,
        };
      })
    );
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.review.queue.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.review.queue.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      queue: enrichedSections,
      total: enrichedSections.length,
      breakdown: {
        draft: draftSections.length,
        in_review: reviewSections.length,
      },
      filters: {
        brandId: brandId || 'all',
      },
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.review.queue.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.review.queue.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withRateLimit(
  withCorrelationId(
    withLogging(getHandler, { 
      component: 'layman', 
      operation: 'get_review_queue' 
    })
  ),
  { limit: 100, windowMs: 60000, keyPrefix: 'ratelimit:layman:review:queue' }
);
