import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { submitSchema } from '@/schemas/quiz.schemas';

export const dynamic = 'force-dynamic';

/**
 * SUBMIT/COMPLETE EXAM
 * POST /api/quiz/submit
 */
async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const rawBody = await _req.json();
    const parsed = submitSchema.safeParse(rawBody);
    if (!parsed.success) {
      recordCounter(METRICS.EXAM.SUBMIT + '.failure', 1, { reason: 'invalid_payload' });
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const { examId } = parsed.data;
    const idempotencyKey = _req.headers.get('idempotency-key') ?? undefined;
    
    // Step 5 Hardening: Pass idempotency key for safe retries
    const result = await ExamEngine.completeExam(examId, _payload.userId, idempotencyKey);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.EXAM.SUBMIT + '.success', 1);
    recordTimer(METRICS.EXAM.SUBMIT + '.duration', durationMs);

    if (result.status === 'processing') {
        return NextResponse.json(result, { 
          status: 202,
          headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    }

    return NextResponse.json(result, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.EXAM.SUBMIT + '.failure', 1, { error: message });
    const headers = { 'X-Duration-Ms': durationMs.toString() };
    
    if (message.includes('Unauthorized') || message.includes('do not own')) {
        return NextResponse.json({ _error: message }, { status: 403, headers });
    }
    if (message.includes('Exam not found')) {
        return NextResponse.json({ _error: message }, { status: 404, headers });
    }
    return NextResponse.json({ _error: message }, { status: 400, headers });
  }
}

export const POST = withLogging(handler, { component: 'quiz', operation: 'submit_exam' });
