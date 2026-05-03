/**
 * Layman Section Validation API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * POST /api/admin/layman/section/:id/validate - Validate section
 */

import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { LaymanService, LaymanAuditService } from '@quiz/db-tutorial';

import { notFound } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const dynamic = 'force-dynamic';

/**
 * Validate section
 */
async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    const payload = await requireAdminRouteAccess(req);
    
    const { id: sectionId } = await params;
    
    // Get section
    const laymanService = new LaymanService();
    const section = await laymanService.getLaymanSectionById(sectionId);
    
    if (!section) {
      return ApiResponse.error(notFound('Layman section', sectionId));
    }
    
    // Validate section
    const validationResult = await laymanService.validateLaymanSection(sectionId);
    
    // Audit log
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId: section.brandId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };
    
    const auditService = new LaymanAuditService();
    await auditService.logContentValidated(auditContext, sectionId, validationResult);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.validate.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.validate.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      sectionId,
      validationResult,
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.validate.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.validate.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withRateLimit(
  withCorrelationId(
    withLogging(postHandler, { 
      component: 'layman', 
      operation: 'validate_section' 
    })
  ),
  { limit: 50, windowMs: 60000, keyPrefix: 'ratelimit:layman:section:validate' }
);
