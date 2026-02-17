import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { idArraySchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type BatchDeleteBody = { ids: string[] };

const log = logger.child({ module: 'admin:questions:batch-delete' });

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

export async function POST(_req: NextRequest) {
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const rawBody = await _req.json() as BatchDeleteBody;
    const parsed = idArraySchema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const { ids } = parsed.data;

        const result = await AdminEngine.deleteQuestionsBatch(ids, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        log.error({ error: message }, 'ADMIN_QUESTIONS_BATCH_DELETE failed');
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}
