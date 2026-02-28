import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import type { BlueprintInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { blueprintSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return { _error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const _payload = await TokenService.verifyAccessToken(_token, true);
        return { userId: _payload.userId };
    } catch {
        return { _error: 'Unauthorized', status: 401 };
    }
}

async function getHandler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if ('_error' in auth && auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const searchParams = _req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '20');
        const search = searchParams.get('search') ?? undefined;

        const data = await AdminEngine.getBlueprints(page, limit, { search });
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.get.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.get.duration', durationMs, { outcome: 'success' });

        return NextResponse.json(data, {
            headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.get.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.get.duration', durationMs, { outcome: 'failure' });
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

async function postHandler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if ('_error' in auth && auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const rawBody = await _req.json() as BlueprintInsert;
        const parsed = blueprintSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
        }

        const result = await AdminEngine.createBlueprint(parsed.data);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.create.success', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.create.duration', durationMs, { outcome: 'success' });

        return NextResponse.json(result, {
            headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.create.failure', 1);
        recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.blueprints.create.duration', durationMs, { outcome: 'failure' });
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_blueprints' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'create_blueprint' });
