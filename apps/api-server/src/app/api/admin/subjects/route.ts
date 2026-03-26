import { subjects } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS, GetSubjectsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminSubjectEngine as AdminSubjectEngineClass } from '@/modules/admin-engine/admin.subject.engine';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';
import { subjectSchema } from '@/schemas/hierarchy.schemas';

type SubjectInsert = typeof subjects.$inferInsert;
type SubjectsQueryResult = {
  subjects: SubjectInsert[];
  total: number;
  nextCursor: string | null;
  limit: number;
};

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
  const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
  if (_token === null || _token === undefined || _token.trim() === '') {
    throw unauthorized('Unauthorized', 'UNAUTHORIZED');
  }
  return await container.get(TokenService).verifyAdminAccessToken(_token);
}

async function getHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    await verifyAdmin(_req);

    const searchParams = _req.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const domainId = searchParams.get('domainId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    bootstrapCQRS();
    const result = await queryBus.dispatch(new GetSubjectsQuery(cursor, limit, { domainId, search })) as SubjectsQueryResult;
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      data: result.subjects,
      total: result.total,
      nextCursor: result.nextCursor,
      limit: result.limit
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.get.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

async function postHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _payload = await verifyAdmin(_req);

    const rawBody = await _req.json();
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
        return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = subjectSchema.safeParse(sanitizedBody);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data;

    const createBody: SubjectInsert = {
      domainId: body.domainId,
      name: body.name,
      description: body.description,
      status: body.status,
      order: body.order,
    };

    const engine = container.get(AdminSubjectEngineClass);
    const result = await engine.createSubject(createBody, _payload.userId);
    if (result?.id !== undefined) {
      void HierarchySyncService.sync('subject', result.id);
    }
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.create.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.create.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(result, 201, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.create.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_subjects' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_subject' }));
