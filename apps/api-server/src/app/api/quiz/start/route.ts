import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { startQuizSchema } from '@/schemas/quiz.schemas';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const startTime = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const rawBody = await _req.json();
    const parsed = startQuizSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;
    const { domainId, blueprintId, ...config } = body;
    const targetId = blueprintId ?? domainId;
    const idempotencyKey = _req.headers.get('idempotency-key') ?? _req.headers.get('Idempotency-Key');

    // 6. Hardening & Validation
    const validationError = validateStartQuizRequest(idempotencyKey, targetId, config);
    if (validationError) return validationError;

    const examData = await ExamEngine.startExam(
      _payload.userId, 
      targetId as string, 
      idempotencyKey as string, 
      config
    );

    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.EXAM.START, 1, { outcome: 'success' });
    recordTimer(METRICS.EXAM.START + '.duration', durationMs, { outcome: 'success' });

    return NextResponse.json(examData, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    logger.error({ err: _error, route: '/api/quiz/start' }, '[QUIZ_START] Error');
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.EXAM.START, 1, { outcome: 'failure' });
    recordTimer(METRICS.EXAM.START + '.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { 
      status: 400,
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  }
}

export const POST = withLogging(handler, { component: 'quiz', operation: 'start_exam' });

type StartQuizConfig = {
    questionCount?: number;
    subjectIds?: string[];
    topicIds?: string[];
    subtopicIds?: string[];
    topics?: string[];
    difficulty?: string;
};

function validateStartQuizRequest(idempotencyKey: string | null, targetId: string | undefined, config: StartQuizConfig) {
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
        return NextResponse.json({ _error: 'Missing Idempotency-Key header' }, { status: 422 });
    }

    if (config.questionCount !== undefined && (config.questionCount < 5 || config.questionCount > 50)) {
        return NextResponse.json({ _error: 'questionCount must be between 5 and 50' }, { status: 422 });
    }

    const arrayFields: (keyof StartQuizConfig)[] = ['subjectIds', 'topicIds', 'subtopicIds', 'topics'];
    for (const field of arrayFields) {
        if (config[field] !== undefined) {
            const value = config[field];
            if (!Array.isArray(value)) return NextResponse.json({ _error: `${field} must be an array` }, { status: 422 });
            if (value.length > 20) return NextResponse.json({ _error: `${field} cannot contain more than 20 items` }, { status: 422 });
        }
    }

    const allowedDifficulties = ['simple', 'intermediate', 'expert', 'mixed'];
    if (typeof config.difficulty === 'string' && config.difficulty !== '' && !allowedDifficulties.includes(config.difficulty)) {
        return NextResponse.json({ _error: `Invalid difficulty. Allowed: ${allowedDifficulties.join(', ')}` }, { status: 422 });
    }

    if (typeof targetId !== 'string' || targetId.trim() === '') {
        return NextResponse.json({ _error: 'blueprintId or domainId is required' }, { status: 422 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetId)) {
        return NextResponse.json({ _error: 'Invalid ID format' }, { status: 422 });
    }

    return null;
}
