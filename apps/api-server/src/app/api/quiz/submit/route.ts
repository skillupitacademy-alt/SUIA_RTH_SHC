import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';

export const dynamic = 'force-dynamic';

interface SubmitRequestBody {
  examId: string;
}

/**
 * SUBMIT/COMPLETE EXAM
 * POST /api/quiz/submit
 */
export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: '_user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: '_user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const { examId } = (await _req.json()) as SubmitRequestBody;
    const idempotencyKey = _req.headers.get('idempotency-key') ?? undefined;
    
    // Step 5 Hardening: Pass idempotency key for safe retries
    const result = await ExamEngine.completeExam(examId, _payload.userId, idempotencyKey);
    
    if (result.status === 'processing') {
        return NextResponse.json(result, { status: 202 });
    }

    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    if (message.includes('Unauthorized') || message.includes('do not own')) {
        return NextResponse.json({ _error: message }, { status: 403 });
    }
    if (message.includes('Exam not found')) {
        return NextResponse.json({ _error: message }, { status: 404 });
    }
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}
