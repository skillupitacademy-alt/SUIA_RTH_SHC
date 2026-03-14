import { METRICS } from '@quiz/observability';
import { type NextRequest } from 'next/server';

import type { ExamStartInput } from '@/dtos/exam.dto';
import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { bootstrapCQRS, commandBus, StartExamCommand } from '@/lib/cqrs';
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { StartExamConfig } from '@/modules/exam-engine/exam.engine';
import { startQuizSchema } from '@/schemas/quiz.schemas';

bootstrapCQRS();

export const dynamic = 'force-dynamic';

import { withCorrelationId } from '@/lib/correlation-id.middleware';

async function postHandler(req: NextRequest) {
  const startTime = Date.now();
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

    const parsed = startQuizSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("Invalid payload");
    }
    const { domainId, blueprintId, ...rest } = parsed.data;
    const config: StartExamConfig = rest;
    
    // Explicitly handle empty strings or missing IDs
    const effectiveBlueprintId = (typeof blueprintId === 'string' && blueprintId.trim() !== '') ? blueprintId : undefined;
    const effectiveDomainId = (typeof domainId === 'string' && domainId.trim() !== '') ? domainId : undefined;
    
    const targetId = effectiveBlueprintId ?? effectiveDomainId;
    const idempotencyKey = req.headers.get('idempotency-key') ?? req.headers.get('Idempotency-Key');

    // 6. Hardening & Validation
    validateStartQuizRequest(idempotencyKey, targetId, config);

    const examData = await commandBus.dispatch(new StartExamCommand({
      userId: payload.userId,
      blueprintId: targetId as string,
      idempotencyKey: idempotencyKey as string,
      config
    }));

    const { toExamStartDTO } = await import('@/dtos/exam.dto');
    const responseDto = toExamStartDTO(examData as unknown as ExamStartInput);

    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.EXAM.START, 1, { outcome: 'success' });
    recordTimer(METRICS.EXAM.START + '.duration', durationMs, { outcome: 'success' });

    return ApiResponse.success(responseDto, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    logger.error({ err: error, route: '/api/quiz/start' }, '[QUIZ_START] Error');
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.EXAM.START, 1, { outcome: 'failure' });
    recordTimer(METRICS.EXAM.START + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error, 400, durationMs.toString());
  }
}

export const POST = withCorrelationId(withLogging(postHandler, { component: 'quiz', operation: 'start_exam' }));


function validateStartQuizRequest(idempotencyKey: string | null, targetId: string | undefined, config: StartExamConfig) {
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
        throw badRequest('Missing Idempotency-Key header');
    }
    if (config.questionCount !== undefined && (config.questionCount < 5 || config.questionCount > 50)) {
        throw badRequest('questionCount must be between 5 and 50');
    }

    const arrayFields: (keyof StartExamConfig)[] = ['subjectIds', 'topicIds', 'subtopicIds', 'topics'];
    for (const field of arrayFields) {
        if (config[field] !== undefined) {
            const value = config[field];
            if (!Array.isArray(value)) throw badRequest(`${field} must be an array`);
            if (value.length > 20) throw badRequest(`${field} cannot contain more than 20 items`);
        }
    }

    const allowedDifficulties = ['simple', 'intermediate', 'expert', 'mixed'];
    if (typeof config.difficulty === 'string' && config.difficulty !== '' && !allowedDifficulties.includes(config.difficulty)) {
        throw badRequest(`Invalid difficulty. Allowed: ${allowedDifficulties.join(', ')}`);
    }

    if (typeof targetId !== 'string' || targetId.trim() === '') {
        throw badRequest('blueprintId or domainId is required');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetId)) {
        throw badRequest('Invalid ID format');
    }
}
