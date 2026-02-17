import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { answerSchema } from '@/schemas/quiz.schemas';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: '_user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: '_user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const rawBody = await _req.json();
    const parsed = answerSchema.safeParse(rawBody);
    const body = parsed.success ? parsed.data : (rawBody as Partial<typeof answerSchema['_input']>);
    
    if (typeof body.examId !== 'string' || typeof body.questionId !== 'string' || typeof body.answer !== 'string') {
      return NextResponse.json({ _error: 'Invalid payload' }, { status: 400 });
    }

    const idempotencyKey = _req.headers.get('idempotency-key') ?? _req.headers.get('Idempotency-Key');

    await ExamEngine.submitAnswer(
      body.examId,
      body.questionId,
      body.answer,
      _payload.userId,
      idempotencyKey ?? undefined
    );
    
    // Step 1 Hardening: Sanitize response. Do NOT return isCorrect/correctAnswer.
    return NextResponse.json({
      success: true,
      data: {
        examId: body.examId,
        questionId: body.questionId,
        status: 'recorded'
      }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}
