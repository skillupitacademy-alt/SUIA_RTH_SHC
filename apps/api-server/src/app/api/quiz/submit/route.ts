import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, forbidden, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { submitSchema } from '@/schemas/quiz.schemas';

export const dynamic = 'force-dynamic';

/**
 * SUBMIT/COMPLETE EXAM
 * POST /api/quiz/submit
 */
async function postHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    if (token === null || token === undefined || token === '') {
      throw unauthorized("Unauthorized");
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required");
    }
    
    // Ingest and sanitize JSON body
    let raw;
    try {
      raw = await req.json();
      validateJsonSize(raw);
      validateJsonDepth(raw);
    } catch {
      throw badRequest("Invalid payload");
    }
    const body = sanitizeJsonField(raw) as Record<string, unknown>;

    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      recordCounter(METRICS.EXAM.SUBMIT + '.failure', 1, { reason: 'invalid_payload' });
      throw badRequest("Invalid payload");
    }
    const { examId } = parsed.data;
    const idempotencyKey = req.headers.get('idempotency-key') ?? undefined;
    
    // Step 5 Hardening: Pass idempotency key for safe retries
    const result = await container.get(ExamEngine).completeExam(examId, payload.userId, idempotencyKey);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.EXAM.SUBMIT + '.success', 1);
    recordTimer(METRICS.EXAM.SUBMIT + '.duration', durationMs);

    if (result.status === 'processing') {
        return ApiResponse.success(result, 202, { 
          'X-Duration-Ms': durationMs.toString() 
        });
    }

    return ApiResponse.success(result, 200, {
        'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.EXAM.SUBMIT + '.failure', 1, { error: message });
    
    if (message.includes('Unauthorized') || message.includes('do not own')) {
        return ApiResponse.error(forbidden(message), 403, durationMs.toString());
    }
    if (message.includes('Exam not found')) {
        return ApiResponse.error(notFound(message), 404, durationMs.toString());
    }
    return ApiResponse.error(error, 400, durationMs.toString());
  }
}

export const POST = withLogging(postHandler, { component: 'quiz', operation: 'submit_exam' });
