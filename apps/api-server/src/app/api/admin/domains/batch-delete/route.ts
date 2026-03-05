import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { AdminDomainEngine } from "@/modules/admin-engine/admin.domain.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

type BatchDeleteBody = { ids: string[] };

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw unauthorized('Unauthorized', 'UNAUTHORIZED');
    }
    return await container.get(TokenService).verifyAccessToken(_token, true);
}

async function handler(_req: NextRequest) {
    try {
        const auth = await _verifyAdmin(_req);
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
