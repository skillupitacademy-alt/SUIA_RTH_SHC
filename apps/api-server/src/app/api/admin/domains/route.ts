import type { domains } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS, GetDomainsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminDomainEngine as AdminDomainEngineClass } from '@/modules/admin-engine/admin.domain.engine';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';
import { domainSchema } from '@/schemas/hierarchy.schemas';

type DomainInsert = typeof domains.$inferInsert;

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
    const result = await queryBus.dispatch(new GetDomainsQuery(cursor, limit, { search })) as {
      domains: DomainInsert[];
      total: number;
      nextCursor: string | null;
      limit: number;
    };
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      data: result.domains,
      total: result.total,
      nextCursor: result.nextCursor,
      limit: result.limit
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.get.duration', durationMs, { outcome: 'failure' });
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
    const parsed = domainSchema.safeParse(sanitizedBody);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data;

    const createBody: DomainInsert = {
      name: body.name,
      description: body.description,
      category: body.category,
      status: body.status,
    };

    const engine = container.get(AdminDomainEngineClass);
    const result = await engine.createDomain(createBody, _payload.userId);
    if (result?.id !== undefined) {
      void HierarchySyncService.sync('domain', result.id);
    }
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.create.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.create.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(result, 201, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.create.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_domains' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_domain' }));
