/**
 * Layman Section Rollback API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * POST /api/admin/layman/section/:id/rollback - Rollback to previous revision
 */

import { 
  LaymanAuditService,
  LaymanRevisionService,
  LaymanService
} from '@quiz/db-tutorial';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, notFound } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { withRateLimit } from '@/middleware/rate-limit.middleware';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

/**
 * Rollback section to specific revision
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
    
    // Parse request body
    const rawBody = await req.json();
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }
    
    const sanitizedBody = sanitizeJsonField(rawBody) as Record<string, unknown>;
    const targetRevisionNumber = sanitizedBody.targetRevisionNumber as number;
    const reason = sanitizedBody.reason;
    
    if (targetRevisionNumber === null || targetRevisionNumber === undefined) {
      return ApiResponse.error(badRequest('Missing required field: targetRevisionNumber'));
    }
    
    // Get existing section
    const laymanService = new LaymanService();
    const existingSection = await laymanService.getLaymanSectionById(sectionId);
    
    if (existingSection === null || existingSection === undefined) {
      return ApiResponse.error(notFound('Layman section', sectionId));
    }
    
    // Rollback to target revision
    const revisionService = new LaymanRevisionService();
    await revisionService.rollbackToRevision(
      sectionId,
      targetRevisionNumber,
      {
        brandId: existingSection.brandId,
        createdBy: payload.userId,
        createdByRole: 'admin',
        reason: (typeof reason === 'string' && reason !== '') ? reason : 'Manual rollback',
      }
    );
    
    // Get updated section
    const updatedSection = await laymanService.getLaymanSectionById(sectionId);
    
    // Audit log
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId: existingSection.brandId,
      ipAddress: (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined),
      userAgent: (req.headers.get('user-agent') ?? undefined),
    };
    
    const auditService = new LaymanAuditService();
    await auditService.logRollback(
      auditContext,
      sectionId,
      existingSection.version,
      targetRevisionNumber
    );
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.rollback.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.rollback.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      section: updatedSection,
      rolledBackFrom: existingSection.version,
      rolledBackTo: targetRevisionNumber,
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.rollback.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.rollback.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withRateLimit(
  withCorrelationId(
    withLogging(postHandler, { 
      component: 'layman', 
      operation: 'rollback_section' 
    })
  ),
  { limit: 20, windowMs: 60000, keyPrefix: 'ratelimit:layman:section:rollback' }
);
