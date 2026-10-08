import { topics } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS, GetTopicsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminTopicEngine as AdminTopicEngineClass } from '@/modules/admin-engine/admin.topic.engine';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { container } from '@/modules/core/container';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';
import { topicSchema } from '@/schemas/hierarchy.schemas';

type TopicInsert = typeof topics.$inferInsert;
type TopicsQueryResult = {
  topics: TopicInsert[];
  total: number;
  nextCursor: string | null;
  limit: number;
};

export const dynamic = 'force-dynamic';

async function getHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    await requireAdminRouteAccess(_req);

    const searchParams = _req.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const subjectId = searchParams.get('subjectId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    bootstrapCQRS();
    const result = await queryBus.dispatch(new GetTopicsQuery(cursor, limit, { subjectId, search })) as TopicsQueryResult;
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      data: result.topics,
      total: result.total,
      nextCursor: result.nextCursor,
      limit: result.limit
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.get.duration', durationMs, { outcome: 'failure' });
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

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = topicSchema.safeParse(sanitizedBody);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data;

    const createBody: TopicInsert = {
      subjectId: body.subjectId,
      name: body.name,
      description: body.description,
      status: body.status,
      complexity: typeof body.complexityLevel === 'number' ? String(body.complexityLevel) : undefined,
      weight: typeof body.weight === 'number' ? body.weight : undefined,
    };

    const engine = container.get(AdminTopicEngineClass);
    const result = await engine.createTopic(createBody, _payload.userId);
    if (result?.id !== undefined) {
      void HierarchySyncService.sync('topic', result.id);
    }
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.create.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.create.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(result, 201, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.create.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_topics' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_topic' }));
