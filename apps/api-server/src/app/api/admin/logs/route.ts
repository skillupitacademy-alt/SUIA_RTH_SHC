import type { NextRequest } from 'next/server';

import { internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { AdminAnalyticsEngine } from "@/modules/admin-engine/admin.analytics.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw unauthorized('Unauthorized');
    }
    return await container.get(TokenService).verifyAccessToken(_token, true);
}

async function handler(_req: NextRequest) {
    try {
        await _verifyAdmin(_req);
        const searchParams = _req.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') ?? '50');
        
        const data = await AdminAnalyticsEngine.getRecentAuditLogs(limit);
        return ApiResponse.success(data);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return ApiResponse.error(internalError(message), 500);
    }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_audit_logs' });
