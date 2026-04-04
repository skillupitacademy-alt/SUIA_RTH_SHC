import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { bootstrapCQRS,GetAuditLogsQuery, queryBus } from '@/lib/cqrs';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
    try {
        await requireAdminRouteAccess(_req);
        const searchParams = _req.nextUrl.searchParams;
        const cursor = searchParams.get('cursor');
        const limit = parseInt(searchParams.get('limit') ?? '50');
        const fields = searchParams.get('fields') ?? undefined;
        
        bootstrapCQRS();
        const data = await queryBus.dispatch(new GetAuditLogsQuery(cursor, limit, fields));
        return ApiResponse.success(data);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'get_logs' }));
