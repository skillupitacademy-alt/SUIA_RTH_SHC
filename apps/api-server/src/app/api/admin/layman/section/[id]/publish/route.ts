/**
 * Layman Section Publish API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * POST /api/admin/layman/section/:id/publish - Publish section
 */

import { 
  LaymanAuditService,
  LaymanService} from '@quiz/db-tutorial';
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
 * Publish section
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
    
    const sanitizedBody = sanitizeJsonField(rawBody);
    const { skipValidation } = sanitizedBody;
    
    // Get existing section
    const laymanService = new LaymanService();
    const existingSection = await laymanService.getLaymanSectionById(sectionId);
    
    if (existingSection === null || existingSection === undefined) {
      return ApiResponse.error(notFound('Layman section', sectionId));
    }
    
    // Publish section
    const publishedSection = await laymanService.publishLaymanSection(sectionId, {
      publishedBy: payload.userId,
      skipValidation: skipValidation === true,
    });
    
    // Audit log
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId: publishedSection.brandId,
      ipAddress: (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined),
      userAgent: (req.headers.get('user-agent') ?? undefined),
    };
    
    const auditService = new LaymanAuditService();
    await auditService.logLifecycleChange(
      auditContext,
      sectionId,
      'section_published',
      existingSection,
      publishedSection
    );
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.publish.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.publish.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(publishedSection, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.publish.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.section.publish.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withRateLimit(
  withCorrelationId(
    withLogging(postHandler, { 
      component: 'layman', 
      operation: 'publish_section' 
    })
  ),
  { limit: 20, windowMs: 60000, keyPrefix: 'ratelimit:layman:section:publish' }
);
