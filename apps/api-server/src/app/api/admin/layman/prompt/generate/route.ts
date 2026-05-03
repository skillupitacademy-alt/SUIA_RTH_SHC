/**
 * Layman Prompt Generation API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * POST /api/admin/layman/prompt/generate - Generate constitutional prompt
 */

import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { 
  LaymanPromptBuilderService,
  LaymanAuditService,
  type PromptGenerationRequest 
} from '@quiz/db-tutorial';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const dynamic = 'force-dynamic';

/**
 * Generate constitutional prompt for Layman section
 */
async function postHandler(req: NextRequest) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    const payload = await requireAdminRouteAccess(req);
    
    // Parse and validate request body
    const rawBody = await req.json();
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }
    
    const sanitizedBody = sanitizeJsonField(rawBody);
    
    // Validate required fields
    const { 
      topicName, 
      subtopicName, 
      subtopicId,
      brandId,
      difficulty,
      learnerType,
      promptTemplateName,
      educationalArchitectureName 
    } = sanitizedBody;
    
    if (!topicName || !subtopicName || !subtopicId || !brandId) {
      return ApiResponse.error(
        badRequest('Missing required fields: topicName, subtopicName, subtopicId, brandId')
      );
    }
    
    // Validate input lengths and content
    if (typeof topicName !== 'string' || topicName.length > 200) {
      return ApiResponse.error(
        badRequest('topicName must be a string with maximum 200 characters')
      );
    }
    
    if (typeof subtopicName !== 'string' || subtopicName.length > 200) {
      return ApiResponse.error(
        badRequest('subtopicName must be a string with maximum 200 characters')
      );
    }
    
    if (typeof brandId !== 'string' || !['realtutorialhub', 'skillup', 'shared'].includes(brandId)) {
      return ApiResponse.error(
        badRequest('brandId must be one of: realtutorialhub, skillup, shared')
      );
    }
    
    // Build prompt generation request
    const request: PromptGenerationRequest = {
      topicName,
      subtopicName,
      subtopicId,
      brandId,
      difficulty: difficulty || 'beginner',
      learnerType,
      promptTemplateName,
      educationalArchitectureName,
      requestedBy: payload.userId,
    };
    
    // Create audit context
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };
    
    // Generate prompt
    const promptBuilderService = new LaymanPromptBuilderService();
    let generatedPrompt;
    try {
      generatedPrompt = await promptBuilderService.generatePrompt(request, auditContext);
    } catch (promptError) {
      // Handle specific prompt generation errors gracefully
      const errorMessage = promptError instanceof Error ? promptError.message : 'Unknown error';
      
      if (errorMessage.includes('template not found') || errorMessage.includes('Template not found')) {
        return ApiResponse.error(
          badRequest('Prompt template not configured. Please contact administrator.', 'VALIDATION_FAILED')
        );
      }
      
      if (errorMessage.includes('architecture not found') || errorMessage.includes('Architecture not found')) {
        return ApiResponse.error(
          badRequest('Educational architecture not configured. Please contact administrator.', 'VALIDATION_FAILED')
        );
      }
      
      // Re-throw other errors to be caught by outer catch
      throw promptError;
    }
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.generate.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.generate.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      promptId: generatedPrompt.id,
      title: generatedPrompt.title,
      systemPrompt: generatedPrompt.systemPrompt,
      userPrompt: generatedPrompt.userPrompt,
      fullPrompt: generatedPrompt.fullPrompt,
      exportFormat: generatedPrompt.exportFormat,
      copyableText: generatedPrompt.copyableText,
      metadata: generatedPrompt.metadata,
      governanceStatus: generatedPrompt.governanceStatus,
    }, 201, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.generate.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.prompt.generate.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withRateLimit(
  withCorrelationId(
    withLogging(postHandler, { 
      component: 'layman', 
      operation: 'generate_prompt' 
    })
  ),
  { limit: 20, windowMs: 60000, keyPrefix: 'ratelimit:layman:prompt:generate' }
);
