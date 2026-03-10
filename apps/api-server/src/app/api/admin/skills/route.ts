import { skills } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS, GetSkillsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminSkillEngine as AdminSkillEngineClass } from '@/modules/admin-engine/admin.skill.engine';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { skillSchema } from '@/schemas/hierarchy.schemas';

type SkillInsert = typeof skills.$inferInsert;
type SkillsQueryResult = {
  skills: SkillInsert[];
  total: number;
  nextCursor: string | null;
  limit: number;
};

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
  const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
  if (_token === undefined || _token === null || _token === '') {
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
    const search = searchParams.get('search') ?? undefined;

    bootstrapCQRS();
    const result = await queryBus.dispatch(new GetSkillsQuery(cursor, limit, { search })) as SkillsQueryResult;
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.skills.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.skills.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      data: result.skills,
      total: result.total,
      nextCursor: result.nextCursor,
      limit: result.limit
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.skills.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.skills.get.duration', durationMs, { outcome: 'failure' });
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
    const parsed = skillSchema.safeParse(sanitizedBody);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data as SkillInsert & { weight?: unknown };

    const parsedWeight: number = typeof body.weight === 'number' && Number.isFinite(body.weight)
      ? body.weight
      : Number(body.weight ?? NaN);
    const createBody: SkillInsert = {
      name: body.name,
      category: body.category,
      mappingType: body.mappingType,
      weight: Number.isFinite(parsedWeight) ? parsedWeight : 1,
    };

    const engine = container.get(AdminSkillEngineClass);
    const result = await engine.createSkill(createBody, _payload.userId);
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.skills.create.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.skills.create.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(result, 201, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.skills.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.skills.create.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_skills' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_skill' }));
