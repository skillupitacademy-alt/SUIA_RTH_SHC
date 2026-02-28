import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { SessionService } from '@/modules/exam-engine/session.service';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const startTime = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const searchParams = _req.nextUrl.searchParams;
    const examId = searchParams.get('examId');

    if (typeof examId !== 'string' || examId.trim() === '') {
      return NextResponse.json({ _error: 'Missing examId' }, { status: 400 });
    }

    // Guardrail: Validate UUID format to prevent SQL errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(examId)) {
        return NextResponse.json({ _error: 'Invalid examId format' }, { status: 422 });
    }

    const state = await SessionService.resumePayload(examId, _payload.userId);
    
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.QUIZ.STATE, 1, { outcome: 'success' });
    recordTimer(METRICS.QUIZ.STATE + '.duration', durationMs, { outcome: 'success' });

    return NextResponse.json(state, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    recordCounter(METRICS.QUIZ.STATE, 1, { outcome: 'failure' });
    recordTimer(METRICS.QUIZ.STATE + '.duration', Date.now() - startTime, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}

export const GET = withLogging(handler, { component: 'quiz', operation: 'get_exam_state' });
