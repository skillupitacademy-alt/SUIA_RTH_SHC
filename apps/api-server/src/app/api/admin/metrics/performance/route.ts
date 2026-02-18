import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:metrics:performance' });

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        log.warn({ reason: 'missing-token', headers: Object.fromEntries(_req.headers) }, 'No admin token found');
        return { _error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const _payload = await TokenService.verifyAccessToken(_token, true);
        return { userId: _payload.userId };
    } catch (err) {
        log.error(
            {
                reason: 'verify-failed',
                tokenHead: _token.slice(0, 12),
                message: err instanceof Error ? err.message : String(err),
            },
            'Admin access token verification failed',
        );
        return { _error: 'Unauthorized', status: 401 };
    }
}

export async function GET(_req: NextRequest) {
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    const searchParams = _req.nextUrl.searchParams;
    const range = searchParams.get('range') ?? '7d';

    try {
        const data = await AdminEngine.getPerformanceAnalytics(range);
        return NextResponse.json(data);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        log.error({ error: message }, 'ADMIN_METRICS_PERFORMANCE failed');
        return NextResponse.json({ _error: 'Internal Server Error', details: message }, { status: 500 });
    }
}
