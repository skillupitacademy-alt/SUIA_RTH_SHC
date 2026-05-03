/**
 * Layman Prompt Export API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * GET /api/admin/layman/prompt/:id/export - Export prompt with instructions
 */

import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { 
  LaymanPromptBuilderService,
  LaymanAuditService 
} from '@quiz/db-tutorial';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const dynamic = 'force-dynamic';

/**
 * Export prompt in specified format
 */
async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    const payload = await requireAdminRouteAccess(req);
    
    const { id: promptId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'plain') as 'plain' | 'markdown' | 'json';
    
    // Validate format
    if (!['plain', 'markdown', 'json'].includes(format)) {
      return ApiResponse.error(
        badRequest('Invalid format. Must be: plain, markdown, or json')
      );
    }
    
    // Create audit context
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId: searchParams.get('brandId') || 'shared',
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };
    
    // Export prompt
    const promptBuilderService = new LaymanPromptBuilderService();
    const exportResult = await promptBuilderService.exportPrompt(promptId, format, auditContext);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.export.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.export.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      format: exportResult.format,
      content: exportResult.content,
      instructions: exportResult.instructions,
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.export.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.export.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withRateLimit(
  withCorrelationId(
    withLogging(getHandler, { 
      component: 'layman', 
      operation: 'export_prompt' 
    })
  ),
  { limit: 50, windowMs: 60000, keyPrefix: 'ratelimit:layman:prompt:export' }
);
