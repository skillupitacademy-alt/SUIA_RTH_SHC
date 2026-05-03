/**
 * Layman Prompt Retrieval API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * GET /api/admin/layman/prompt/:id - Get prompt details
 */

import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { LaymanPromptIntegrityService } from '@quiz/db-tutorial';

import { notFound } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const dynamic = 'force-dynamic';

/**
 * Get prompt details by ID
 */
async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    await requireAdminRouteAccess(req);
    
    const { id: promptId } = await params;
    
    // Get prompt history
    const integrityService = new LaymanPromptIntegrityService();
    const promptHistory = await integrityService.getPromptHistory(promptId);
    
    if (!promptHistory) {
      return ApiResponse.error(notFound('Prompt', promptId));
    }
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      id: promptHistory.id,
      subtopicId: promptHistory.subtopicId,
      sectionId: promptHistory.sectionId,
      templateName: promptHistory.templateName,
      templateVersion: promptHistory.templateVersion,
      systemPrompt: promptHistory.systemPrompt,
      userPrompt: promptHistory.userPrompt,
      fullPrompt: promptHistory.fullPrompt,
      variables: promptHistory.variables,
      promptHash: promptHistory.promptHash,
      brandId: promptHistory.brandId,
      educationalArchitectureName: promptHistory.educationalArchitectureName,
      uiArchitectureName: promptHistory.uiArchitectureName,
      wasUsed: promptHistory.wasUsed,
      usedAt: promptHistory.usedAt,
      exportCount: promptHistory.exportCount,
      lastExportedAt: promptHistory.lastExportedAt,
      exportFormat: promptHistory.exportFormat,
      generatedBy: promptHistory.generatedBy,
      createdAt: promptHistory.createdAt,
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.get.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withRateLimit(
  withCorrelationId(
    withLogging(getHandler, { 
      component: 'layman', 
      operation: 'get_prompt' 
    })
  ),
  { limit: 100, windowMs: 60000, keyPrefix: 'ratelimit:layman:prompt:get' }
);
