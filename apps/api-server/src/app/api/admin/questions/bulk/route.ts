import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import type { CreateQuestionInput } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { bulkQuestionSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type BulkQuestionBody = {
  topicId: string;
  subtopicId?: string;
  skillId?: string;
  skillIds?: string[];
  questions: CreateQuestionInput[];
};

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return ApiResponse.error(badRequest('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await container.get(TokenService).verifyAccessToken(_token, true);

    if (!(await _verifyAdmin(_payload))) {
        return ApiResponse.error(badRequest('Forbidden', 'FORBIDDEN'));
    }

    const rawBody = await _req.json() as BulkQuestionBody;

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
        return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const sanitizedBody = sanitizeJsonField(rawBody) as BulkQuestionBody;
    const parsed = bulkQuestionSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
        return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const { topicId, subtopicId, skillId, skillIds, questions } = parsed.data;

    const result = await AdminEngine.bulkCreateQuestionsWithContext(
        questions, 
        { topicId, subtopicId, skillId, skillIds }, 
        _payload.userId
    );

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.BULK_UPLOAD, 1, { outcome: 'success', count: result.length });
    recordTimer(METRICS.ADMIN.BULK_UPLOAD + '.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({ 
        success: true, 
        count: result.length,
        message: `Successfully uploaded ${result.length} questions` 
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.BULK_UPLOAD, 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.BULK_UPLOAD + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(message, 500);
  }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'bulk_upload_questions' });
