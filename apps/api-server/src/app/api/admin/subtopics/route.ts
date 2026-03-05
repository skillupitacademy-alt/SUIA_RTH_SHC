import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, forbidden, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import type { SubtopicInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { subtopicSchema } from '@/schemas/hierarchy.schemas';

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token.trim() === '') {
        throw unauthorized('Unauthorized', 'UNAUTHORIZED');
    }
    return await container.get(TokenService).verifyAccessToken(_token, true);
}

async function getHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    await verifyAdmin(_req);

    const searchParams = _req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const topicId = searchParams.get('topicId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const result = await AdminEngine.getSubtopics(page, limit, { topicId, search });
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subtopics.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.paginated(result.data, result.total, page, limit);
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
    const _payload = await verifyAdmin(_req);

    if (!(await _verifyAdmin(_payload))) {
        return ApiResponse.error(forbidden());
    }

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

    const result = await AdminEngine.createSubtopic(createBody, _payload.userId);
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

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_subtopics' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'create_subtopic' });
