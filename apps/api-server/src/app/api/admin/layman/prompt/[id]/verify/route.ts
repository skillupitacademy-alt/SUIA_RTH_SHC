/**
 * Layman Prompt Verification API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * POST /api/admin/layman/prompt/:id/verify - Verify prompt integrity
 */

import { 
  LaymanAuditService, 
  LaymanPromptIntegrityService} from '@quiz/db-tutorial';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { withRateLimit } from '@/middleware/rate-limit.middleware';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

/**
 * Verify prompt integrity (tamper detection)
 */
async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    const payload = await requireAdminRouteAccess(req);
    
    const { id: promptId } = await params;
    
    // Parse and validate request body
    const rawBody = await req.json();
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }
    
    const sanitizedBody = sanitizeJsonField(rawBody) as Record<string, unknown>;
    const providedPrompt = sanitizedBody.providedPrompt;
    const brandId = sanitizedBody.brandId;
    
    if (typeof providedPrompt !== 'string' || providedPrompt === '') {
      return ApiResponse.error(badRequest('Missing required field: providedPrompt'));
    }
    
    // Create audit context
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId: (typeof brandId === 'string' && brandId !== '') ? brandId : 'shared',
      ipAddress: (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined),
      userAgent: (req.headers.get('user-agent') ?? undefined),
    };
    
    // Verify prompt integrity
    const integrityService = new LaymanPromptIntegrityService();
    const verification = await integrityService.verifyPromptIntegrity(promptId, providedPrompt);
    
    // Log tamper detection if detected
    if (verification.tampered) {
      const auditService = new LaymanAuditService();
      await auditService.logTamperDetected(auditContext, promptId, {
        expectedHash: verification.expectedHash,
        actualHash: verification.actualHash,
      });
    }
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.verify.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.verify.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      isValid: verification.isValid,
      promptId: verification.promptId,
      tampered: verification.tampered,
      errors: verification.errors,
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.verify.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.verify.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withRateLimit(
  withCorrelationId(
    withLogging(postHandler, { 
      component: 'layman', 
      operation: 'verify_prompt' 
    })
  ),
  { limit: 50, windowMs: 60000, keyPrefix: 'ratelimit:layman:prompt:verify' }
);
