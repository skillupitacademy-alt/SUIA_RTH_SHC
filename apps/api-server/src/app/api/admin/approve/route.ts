import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { verifyAdminOrInfraToken } from '@/modules/auth/admin-audience.util';
import { publishSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type ApproveBody = { id: string };
type VerifyResult =
    | { userId: string; scope: string }
    | { _error: string; status: number; scope?: string };

async function _verifyAdmin(_req: NextRequest): Promise<VerifyResult> {
    try {
        const { payload, audience } = await verifyAdminOrInfraToken(_req);
        return { userId: payload.userId, scope: audience };
    } catch {
        return { _error: 'Unauthorized', status: 401, scope: 'admin' };
    }
}

async function handler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if ('_error' in auth) {
        return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });
    }

    try {
        const rawBody = await _req.json() as unknown;
        const parsed = publishSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
        }
        const body = parsed.data as ApproveBody;
        const result = await AdminEngine.publishQuestion(body.id, auth.userId);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'approve', outcome: 'success' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { action: 'approve', outcome: 'success' });
        
        return NextResponse.json(result, {
            headers: { 'X-Duration-Ms': durationMs.toString() }
        });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'approve', outcome: 'failure' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { action: 'approve', outcome: 'failure' });
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'approve_question' });
