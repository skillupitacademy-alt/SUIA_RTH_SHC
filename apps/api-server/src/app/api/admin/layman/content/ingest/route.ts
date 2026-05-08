/**
 * Layman Content Ingestion API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * POST /api/admin/layman/content/ingest - Ingest AI response
 */

import { 
  LaymanAuditService,
  LaymanContentParserService,
  LaymanContentValidationService,
  LaymanPromptIntegrityService,
  LaymanRevisionService,
  LaymanService
} from '@quiz/db-tutorial';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { withPayloadSizeLimit } from '@/middleware/payload-size.middleware';
import { withRateLimit } from '@/middleware/rate-limit.middleware';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

/**
 * Ingest AI response and create/update Layman section
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
    
    const sanitizedBody = sanitizeJsonField(rawBody) as Record<string, unknown>;
    const rawAIResponse = sanitizedBody.rawAIResponse;
    const promptId = sanitizedBody.promptId as string | undefined;
    const subtopicId = sanitizedBody.subtopicId;
    const brandId = sanitizedBody.brandId;
    const educationalArchitectureName = sanitizedBody.educationalArchitectureName as string | undefined;
    const uiArchitectureName = sanitizedBody.uiArchitectureName as string | undefined;
    const verifyPrompt = sanitizedBody.verifyPrompt;
    
    if (
      typeof rawAIResponse !== 'string' || rawAIResponse === '' ||
      typeof subtopicId !== 'string' || subtopicId === '' ||
      typeof brandId !== 'string' || brandId === ''
    ) {
      return ApiResponse.error(
        badRequest('Missing required fields: rawAIResponse, subtopicId, brandId')
      );
    }
    
    // Create audit context
    const auditContext = {
      userId: payload.userId,
      userRole: 'admin',
      brandId,
      ipAddress: (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined),
      userAgent: (req.headers.get('user-agent') ?? undefined),
    };
    
    // Verify prompt integrity if promptId provided and verification requested
    if (promptId !== undefined && promptId !== null && promptId !== '' && verifyPrompt !== false) {
      const integrityService = new LaymanPromptIntegrityService();
      const promptHistory = await integrityService.getPromptHistory(promptId);
      
      if (promptHistory !== null && promptHistory !== undefined) {
        const verification = await integrityService.verifyPromptIntegrity(
          promptId, 
          promptHistory.fullPrompt
        );
        
        if (verification.tampered) {
          const auditService = new LaymanAuditService();
          await auditService.logTamperDetected(auditContext, promptId, {
            expectedHash: verification.expectedHash,
            actualHash: verification.actualHash,
          });
          
          return ApiResponse.error(
            badRequest('Prompt integrity verification failed. Prompt may have been tampered with.', 'VALIDATION_FAILED')
          );
        }
      }
    }
    
    // Validate rawAIResponse before parsing
    if (typeof rawAIResponse !== 'string') {
      return ApiResponse.error(
        badRequest('rawAIResponse must be a string')
      );
    }
    
    if (rawAIResponse.trim().length < 50) {
      return ApiResponse.error(
        badRequest('AI response is too short (minimum 50 characters)')
      );
    }
    
    if (rawAIResponse.length > 5 * 1024 * 1024) { // 5MB limit
      return ApiResponse.error(
        badRequest('AI response is too large (maximum 5MB)', 'VALIDATION_FAILED')
      );
    }
    
    // Parse AI response (with sanitization)
    const parserService = new LaymanContentParserService();
    let parsedContent;
    try {
      parsedContent = parserService.parseRawAIResponse(rawAIResponse, true);
    } catch (parseError) {
      return ApiResponse.error(
        badRequest('Failed to parse AI response: ' + (parseError instanceof Error ? parseError.message : 'Invalid format'))
      );
    }
    
    // Validate parsed content
    const validationService = new LaymanContentValidationService();
    let validationResult;
    try {
      validationResult = validationService.validateParsedContent(parsedContent);
    } catch (validationError) {
      return ApiResponse.error(
        badRequest('Content validation failed: ' + (validationError instanceof Error ? validationError.message : 'Invalid content'))
      );
    }
    
    // Check if section already exists
    const laymanService = new LaymanService();
    let section = await laymanService.getLaymanSectionBySubtopicId(subtopicId, brandId);
    
    let sectionId: string;
    let isNewSection = false;
    
    if (section === null || section === undefined) {
      // Create new section
      section = await laymanService.createLaymanSection({
        subtopicId,
        brandId,
        educationalArchitectureName,
        uiArchitectureName,
        content: {
          subsections: parsedContent,
        },
        createdBy: payload.userId,
      });
      sectionId = section.id;
      isNewSection = true;
    } else {
      // Update existing section
      section = await laymanService.updateLaymanSection(section.id, {
        content: {
          subsections: parsedContent,
        },
        updatedBy: payload.userId,
      });
      sectionId = section.id;
    }
    
    // Create revision
    const revisionService = new LaymanRevisionService();
    if (isNewSection) {
      await revisionService.createInitialRevision(
        sectionId,
        { subsections: parsedContent },
        {
          brandId,
          createdBy: payload.userId,
          createdByRole: 'admin',
          status: section.status,
          validationResults: validationResult,
          sourcePromptId: promptId,
          aiResponseRaw: rawAIResponse,
        }
      );
    } else {
      await revisionService.createRevision(
        sectionId,
        { subsections: parsedContent },
        {
          changeType: 'ai_regeneration',
          changeReason: 'AI response ingested',
          sourcePromptId: promptId,
          aiResponseRaw: rawAIResponse,
        },
        {
          brandId,
          createdBy: payload.userId,
          createdByRole: 'admin',
          status: section.status,
          validationResults: validationResult,
        }
      );
    }
    
    // Mark prompt as used
    if (promptId !== undefined && promptId !== null && promptId !== '') {
      const integrityService = new LaymanPromptIntegrityService();
      await integrityService.markPromptAsUsed(promptId, sectionId);
    }
    
    // Audit log
    const auditService = new LaymanAuditService();
    await auditService.logContentIngested(auditContext, sectionId, promptId, rawAIResponse);
    await auditService.logContentValidated(auditContext, sectionId, validationResult);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.content.ingest.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.content.ingest.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      sectionId,
      isNewSection,
      parsedContent,
      validationResult,
      section: {
        id: section.id,
        subtopicId: section.subtopicId,
        status: section.status,
        version: section.version,
        brandId: section.brandId,
      },
    }, isNewSection ? 201 : 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.content.ingest.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.content.ingest.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withPayloadSizeLimit(
  withRateLimit(
    withCorrelationId(
      withLogging(postHandler, { 
        component: 'layman', 
        operation: 'ingest_content' 
      })
    ),
    { limit: 20, windowMs: 60000, keyPrefix: 'ratelimit:layman:content:ingest' }
  ),
  5 * 1024 * 1024 // 5MB limit
);
