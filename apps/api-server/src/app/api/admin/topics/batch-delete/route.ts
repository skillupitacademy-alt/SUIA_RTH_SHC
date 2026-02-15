import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

type BatchDeleteBody = { ids: string[] };

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
        const { ids } = await _req.json() as BatchDeleteBody;
        if (ids === null || ids === undefined || !Array.isArray(ids)) {
            return NextResponse.json({ _error: 'Invalid IDs' }, { status: 400 });
        }

        const result = await AdminEngine.deleteTopicsBatch(ids, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_TOPICS_BATCH_DELETE] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}
