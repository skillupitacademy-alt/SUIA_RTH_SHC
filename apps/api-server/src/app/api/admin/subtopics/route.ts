import { subtopics } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS, GetSubtopicsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminSubtopicEngine as AdminSubtopicEngineClass } from '@/modules/admin-engine/admin.subtopic.engine';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { container } from '@/modules/core/container';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';
import { subtopicSchema } from '@/schemas/hierarchy.schemas';

type SubtopicInsert = typeof subtopics.$inferInsert;
type SubtopicsQueryResult = {
  subtopics: SubtopicInsert[];
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
    const topicId = searchParams.get('topicId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    bootstrapCQRS();
    const result = await queryBus.dispatch(new GetSubtopicsQuery(cursor, limit, { topicId, search })) as SubtopicsQueryResult;
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      data: result.subtopics,
      total: result.total,
      nextCursor: result.nextCursor,
      limit: result.limit
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.get.duration', durationMs, { outcome: 'failure' });
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
    const parsed = subtopicSchema.safeParse(sanitizedBody);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data;

    const createBody: SubtopicInsert = {
      topicId: body.topicId,
      name: body.name,
      description: body.description,
      depthLevel: body.depthLevel,
    };

    const engine = container.get(AdminSubtopicEngineClass);
    const result = await engine.createSubtopic(createBody, _payload.userId);
    if (result?.id !== undefined) {
      void HierarchySyncService.sync('subtopic', result.id);
    }
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.create.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.create.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(result, 201, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.create.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_subtopics' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_subtopic' }));
