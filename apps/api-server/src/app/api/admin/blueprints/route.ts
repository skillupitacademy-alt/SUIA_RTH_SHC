import type { examBlueprints } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { bootstrapCQRS,GetBlueprintsQuery, queryBus } from '@/lib/cqrs';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminBlueprintEngine as AdminBlueprintEngineClass } from '@/modules/admin-engine/admin.blueprint.engine';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { blueprintSchema } from '@/schemas/admin.schemas';

type BlueprintInsert = typeof examBlueprints.$inferInsert;

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return { _error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const _payload = await container.get(TokenService).verifyAdminAccessToken(_token);
        return { userId: _payload.userId };
    } catch {
        return { _error: 'Unauthorized', status: 401 };
    }
}

async function getHandler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if ('_error' in auth && auth._error !== undefined) return ApiResponse.error(unauthorized(auth._error), auth.status);

    try {
        const searchParams = _req.nextUrl.searchParams;
        const cursor = searchParams.get('cursor');
        const limit = parseInt(searchParams.get('limit') ?? '20');
        const search = searchParams.get('search') ?? undefined;
        const fields = searchParams.get('fields') ?? undefined;

        bootstrapCQRS();
        const data = await queryBus.dispatch(new GetBlueprintsQuery(cursor, limit, { search, fields }));
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.get.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.get.duration', durationMs, { outcome: 'success' });

        return ApiResponse.success(data, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.get.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.get.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(internalError(message), 500);
    }
}

async function postHandler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if ('_error' in auth && auth._error !== undefined) return ApiResponse.error(unauthorized(auth._error), auth.status);

    try {
        const rawBody = await _req.json().catch(() => null) as BlueprintInsert | null;
        if (rawBody === null || !validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
            return ApiResponse.error(badRequest('Payload too deep or large'), 400);
        }
        const sanitized = sanitizeJsonField(rawBody) as BlueprintInsert;
        const parsed = blueprintSchema.safeParse(sanitized);
        if (!parsed.success) {
            return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues), 400);
        }

        const engine = container.get(AdminBlueprintEngineClass);
        const result = await engine.createBlueprint(parsed.data);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.create.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.create.duration', durationMs, { outcome: 'success' });

        return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.create.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.create.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(internalError(message), 500);
    }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_blueprints' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_blueprint' }));
