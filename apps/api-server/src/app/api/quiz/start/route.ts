import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';

export const dynamic = 'force-dynamic';

interface StartQuizConfig {
  questionCount?: number;
  subjectIds?: string[];
  topicIds?: string[];
  subtopicIds?: string[];
  topics?: string[];
  difficulty?: string;
}

interface StartQuizBody extends StartQuizConfig {
  domainId?: string;
  blueprintId?: string;
}

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: '_user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: '_user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const body = (await _req.json()) as StartQuizBody;
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

    return NextResponse.json(examData);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    console.error('[QUIZ_START] Error:', message);
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}

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
