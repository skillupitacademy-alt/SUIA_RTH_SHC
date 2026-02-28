import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw new Error('Unauthorized');
    }
    return await TokenService.verifyAccessToken(_token, true);
}

async function handler(_req: NextRequest) {
    try {
        await _verifyAdmin(_req);
        const searchParams = _req.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') ?? '50');
        
        const data = await AdminEngine.getRecentAuditLogs(limit);
        return NextResponse.json(data);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_audit_logs' });
