/**
 * Layman Section Management API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * GET /api/admin/layman/section/:id - Get section details
 * PUT /api/admin/layman/section/:id - Update section
 * DELETE /api/admin/layman/section/:id - Archive section
 */

import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { 
  LaymanService,
  LaymanAuditService,
  LaymanRevisionService
} from '@quiz/db-tutorial';

import { badRequest, notFound } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const dynamic = 'force-dynamic';

/**
 * Get section details
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
    
    // Get section
    const laymanService = new LaymanService();
    const section = await laymanService.getLaymanSectionById(sectionId);
    
    if (!section) {
      return ApiResponse.error(notFound('Layman section', sectionId));
    }
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(section, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.get.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

/**
 * Update section
 */
async function putHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    const payload = await requireAdminRouteAccess(req);
    
    const { id: sectionId } = await params;
    
    // Parse and validate request body
    const rawBody = await req.json();
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }
    
    const sanitizedBody = sanitizeJsonField(rawBody);
    const { content, status, educationalArchitectureId, uiArchitectureId, changeReason } = sanitizedBody;
    
    // Get existing section
    const laymanService = new LaymanService();
    const existingSection = await laymanService.getLaymanSectionById(sectionId);
    
    if (!existingSection) {
      return ApiResponse.error(notFound('Layman section', sectionId));
    }
    
    // Update section
    const updatedSection = await laymanService.updateLaymanSection(sectionId, {
      content,
      status,
      educationalArchitectureId,
      uiArchitectureId,
      updatedBy: payload.userId,
    });
    
    // Create revision if content changed
    if (content) {
      const revisionService = new LaymanRevisionService();
      await revisionService.createRevision(
        sectionId,
        content,
        {
          changeType: 'manual_revision',
          changeReason: changeReason || 'Manual update',
        },
        {
          brandId: updatedSection.brandId,
          createdBy: payload.userId,
          createdByRole: 'admin',
          status: updatedSection.status,
        }
      );
    }
    
    // Audit log
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId: updatedSection.brandId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };
    
    const auditService = new LaymanAuditService();
    await auditService.logLifecycleChange(
      auditContext,
      sectionId,
      'section_updated',
      existingSection,
      updatedSection
    );
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.update.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.update.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(updatedSection, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.update.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.update.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

/**
 * Archive section (soft delete)
 */
async function deleteHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    const payload = await requireAdminRouteAccess(req);
    
    const { id: sectionId } = await params;
    
    // Get existing section
    const laymanService = new LaymanService();
    const existingSection = await laymanService.getLaymanSectionById(sectionId);
    
    if (!existingSection) {
      return ApiResponse.error(notFound('Layman section', sectionId));
    }
    
    // Archive section
    const archivedSection = await laymanService.archiveLaymanSection(sectionId, {
      archivedBy: payload.userId,
    });
    
    // Audit log
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId: archivedSection.brandId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };
    
    const auditService = new LaymanAuditService();
    await auditService.logLifecycleChange(
      auditContext,
      sectionId,
      'section_archived',
      existingSection,
      archivedSection
    );
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.archive.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.archive.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(archivedSection, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.archive.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.archive.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withRateLimit(
  withCorrelationId(
    withLogging(getHandler, { 
      component: 'layman', 
      operation: 'get_section' 
    })
  ),
  { limit: 100, windowMs: 60000, keyPrefix: 'ratelimit:layman:section:get' }
);

export const PUT = withRateLimit(
  withCorrelationId(
    withLogging(putHandler, { 
      component: 'layman', 
      operation: 'update_section' 
    })
  ),
  { limit: 30, windowMs: 60000, keyPrefix: 'ratelimit:layman:section:update' }
);

export const DELETE = withRateLimit(
  withCorrelationId(
    withLogging(deleteHandler, { 
      component: 'layman', 
      operation: 'archive_section' 
    })
  ),
  { limit: 20, windowMs: 60000, keyPrefix: 'ratelimit:layman:section:archive' }
);
