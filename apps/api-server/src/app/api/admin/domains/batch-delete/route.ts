import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

type BatchDeleteBody = { ids: string[] };

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw new Error('Unauthorized');
    }
    return await TokenService.verifyAccessToken(_token, true);
}

async function handler(_req: NextRequest) {
    try {
        const auth = await _verifyAdmin(_req);
        const { ids } = await _req.json() as BatchDeleteBody;
        if (ids === null || ids === undefined || !Array.isArray(ids)) {
            return NextResponse.json({ _error: 'Invalid IDs' }, { status: 400 });
        }

        const result = await AdminEngine.deleteDomainsBatch(ids, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'batch_delete_domains' });
