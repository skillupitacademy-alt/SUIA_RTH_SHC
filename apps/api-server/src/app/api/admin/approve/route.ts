import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

type ApproveBody = { id: string };

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return { _error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const payload = await TokenService.verifyAccessToken(_token, true);
        return { userId: payload.userId };
    } catch {
        return { _error: 'Unauthorized', status: 401 };
    }
}

export async function POST(_req: NextRequest) {
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const body = await _req.json() as ApproveBody;
        // AdminEngine has publishQuestion, but not approveQuestion. 
        // Mapping both to publishQuestion as they serve the same intent (activating content)
        const result = await AdminEngine.publishQuestion(body.id, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_APPROVE/PUBLISH] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}
