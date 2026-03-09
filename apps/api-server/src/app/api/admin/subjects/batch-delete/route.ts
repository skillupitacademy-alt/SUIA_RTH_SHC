import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminSubjectEngine } from "@/modules/admin-engine/admin.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

type BatchDeleteBody = { ids: string[] };

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token === '') {
        throw unauthorized('Unauthorized', 'UNAUTHORIZED');
    }
    return await container.get(TokenService).verifyAdminAccessToken(_token);
}

async function handler(_req: NextRequest) {
    try {
        const auth = await _verifyAdmin(_req);
        const rawBody = await _req.json();
        
        if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
            return ApiResponse.error(badRequest('Payload too deep or large'));
        }

        const { ids } = rawBody as BatchDeleteBody;
        if (!Array.isArray(ids)) {
            return ApiResponse.error(badRequest('Invalid IDs (expected array)'));
        }

        const result = await AdminSubjectEngine.deleteSubjectsBatch(ids, auth.userId!);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'batch_delete_subjects' });
