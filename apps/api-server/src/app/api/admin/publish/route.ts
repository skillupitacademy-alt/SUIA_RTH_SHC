import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { publishSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type PublishBody = { id: string };

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

async function handler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const rawBody = await _req.json() as PublishBody;
        const parsed = publishSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
        }
        const body = parsed.data;
        const result = await AdminEngine.publishQuestion(body.id, auth.userId!);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { outcome: 'success' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { outcome: 'success' });
        
        return NextResponse.json(result, {
            headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { outcome: 'failure' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { outcome: 'failure' });
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'publish_question' });
