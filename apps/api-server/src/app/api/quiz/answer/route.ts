import { METRICS } from '@quiz/observability';
import { type NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { answerSchema } from '@/schemas/quiz.schemas';

export const dynamic = 'force-dynamic';

async function postHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    if (token === null || token === undefined || token === '') {
      throw unauthorized("Unauthorized");
    }

    const payload = await container.get(TokenService).verifyAccessToken(token, false);
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
    const sanitized = sanitizeJsonField(raw) as Record<string, unknown>;

    const parsed = answerSchema.safeParse(sanitized);
    if (!parsed.success) {
      recordCounter(METRICS.QUIZ.ANSWER, 1, { outcome: 'invalid_payload' });
      throw badRequest("Invalid payload");
    }
    const body = parsed.data;
    
    const idempotencyKey = req.headers.get('idempotency-key') ?? req.headers.get('Idempotency-Key');

    await container.get(ExamEngine).submitAnswer(
      body.examId,
      body.questionId,
      body.answer,
      payload.userId,
      idempotencyKey ?? undefined
    );
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.QUIZ.ANSWER, 1, { outcome: 'success' });
    recordTimer(METRICS.QUIZ.ANSWER + '.duration', durationMs, { outcome: 'success' });

    // Step 1 Hardening: Sanitize response. Do NOT return isCorrect/correctAnswer.
    return ApiResponse.success({
      success: true,
      data: {
        examId: body.examId,
        questionId: body.questionId,
        status: 'recorded'
      }
    }, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.QUIZ.ANSWER, 1, { outcome: 'failure' });
    recordTimer(METRICS.QUIZ.ANSWER + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error, 400, durationMs.toString());
  }
}

export const POST = withLogging(postHandler, { component: 'quiz', operation: 'answer_question' });
