import { topics } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, forbidden, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminTopicEngine } from "@/modules/admin-engine/admin.engine";
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { topicSchema } from '@/schemas/hierarchy.schemas';

type TopicInsert = typeof topics.$inferInsert;

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
  const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
  if (_token === undefined || _token === null || _token === '') {
    throw unauthorized('Unauthorized', 'UNAUTHORIZED');
  }
  return await container.get(TokenService).verifyAccessToken(_token, true);
}

async function getHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    await verifyAdmin(_req);

    const searchParams = _req.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const subjectId = searchParams.get('subjectId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const result = await AdminTopicEngine.getTopics(cursor, limit, { subjectId, search });
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
    const _payload = await verifyAdmin(_req);

    if (!(await _verifyAdmin(_payload))) {
        return ApiResponse.error(forbidden());
    }

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
      complexityLevel: typeof body.complexityLevel === 'number' ? body.complexityLevel : undefined,
      weight: typeof body.weight === 'number' ? body.weight : undefined,
      learningUrl: body.learningUrl,
      detailedNotesPath: body.detailedNotesPath,
    };

    const result = await AdminTopicEngine.createTopic(createBody, _payload.userId);
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

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_topics' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'create_topic' });
