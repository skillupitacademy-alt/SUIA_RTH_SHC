import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { verifyAdminOrInfraToken } from '@/modules/auth/admin-audience.util';
import { publishSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:approve' });

type ApproveBody = { id: string };

async function _verifyAdmin(_req: NextRequest) {
    try {
        const { payload, audience } = await verifyAdminOrInfraToken(_req);
        return { userId: payload.userId, scope: audience };
    } catch {
        return { _error: 'Unauthorized', status: 401, scope: 'admin' };
    }
}

export async function POST(_req: NextRequest) {
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const rawBody = await _req.json() as ApproveBody;
        const parsed = publishSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
        }
        const body = parsed.data;
        // AdminEngine has publishQuestion, but not approveQuestion. 
        // Mapping both to publishQuestion as they serve the same intent (activating content)
        const result = await AdminEngine.publishQuestion(body.id, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        log.error({ error: message }, 'ADMIN_APPROVE failed');
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}
