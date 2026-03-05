import { subjects } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminSubjectEngine } from "@/modules/admin-engine/admin.subject.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { subjectSchema } from '@/schemas/hierarchy.schemas';

type SubjectInsert = typeof subjects.$inferInsert;

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
  const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
  if (_token === null || _token === undefined || _token.trim() === '') {
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
    const domainId = searchParams.get('domainId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const result = await AdminSubjectEngine.getSubjects(page, limit, { domainId, search });
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.subjects.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.paginated(result.data, result.total, page, limit);
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

    const result = await AdminSubjectEngine.createSubject(createBody, _payload.userId);
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

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_subjects' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'create_subject' });
