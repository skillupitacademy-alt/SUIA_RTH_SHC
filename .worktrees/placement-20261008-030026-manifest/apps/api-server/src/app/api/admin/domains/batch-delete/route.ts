import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { AdminDomainEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

type BatchDeleteBody = { ids: string[] };

async function handler(_req: NextRequest) {
    try {
        const auth = await requireAdminRouteAccess(_req);
        const { ids } = await _req.json() as BatchDeleteBody;
        if (ids === null || ids === undefined || !Array.isArray(ids)) {
            return ApiResponse.error(badRequest('Invalid IDs'));
        }

        const result = await AdminDomainEngine.deleteDomainsBatch(ids, auth.userId!);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'batch_delete_domains' });
