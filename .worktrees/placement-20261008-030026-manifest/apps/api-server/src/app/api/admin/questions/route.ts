import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS, GetQuestionsQuery, queryBus } from '@/lib/cqrs';
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminQuestionEngine as AdminQuestionEngineClass, type CreateQuestionInput } from "@/modules/admin-engine/admin.question.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { container } from '@/modules/core/container';
import { questionSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:questions' });
type QuestionsQueryResult = {
  questions: unknown[];
  total: number;
  nextCursor: string | null;
  limit: number;
};

async function getHandler(_req: NextRequest) {
    const start = Date.now();
  try {
    await requireAdminRouteAccess(_req);
    
    const searchParams = _req.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const fields = searchParams.get('fields') ?? undefined;
    
    const filters = {
        domainId: searchParams.get('domainId') ?? undefined,
        subjectId: searchParams.get('subjectId') ?? undefined,
        topicId: searchParams.get('topicId') ?? undefined,
        subtopicId: searchParams.get('subtopicId') ?? undefined,
        skillIds: searchParams.getAll('skillIds').length > 0 ? searchParams.getAll('skillIds') : undefined,
        status: searchParams.get('status') ?? undefined,
        search: searchParams.get('search') ?? undefined,
        fields,
    };

    bootstrapCQRS();
    const result = await queryBus.dispatch(new GetQuestionsQuery(cursor, limit, filters)) as QuestionsQueryResult;

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.questions.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.questions.get.duration', durationMs, { outcome: 'success' });
    return ApiResponse.success({
      data: result.questions,
      total: result.total,
      nextCursor: result.nextCursor,
      limit: result.limit
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    log.error({ error: _error }, 'ADMIN_QUESTIONS failed');
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.questions.get.failure', 1, { reason: 'internal_error' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.questions.get.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

async function postHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _payload = await requireAdminRouteAccess(_req);

    const rawBody = await _req.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as CreateQuestionInput;
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }

    const engine = container.get(AdminQuestionEngineClass);
    const result = await engine.createQuestion(parsed.data, _payload.userId);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'create', outcome: 'success' });
    recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { action: 'create', outcome: 'success' });
    
    return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    log.error({ error: _error }, 'ADMIN_QUESTIONS_POST failed');
    recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'create', outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_questions' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_question' }));
