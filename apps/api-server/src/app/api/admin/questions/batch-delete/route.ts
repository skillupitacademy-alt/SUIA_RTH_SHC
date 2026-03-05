import type { NextRequest } from 'next/server';

import { badRequest, internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { idArraySchema } from '@/schemas/admin.schemas';

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
        const auth = await _verifyAdmin(_req);
        const rawBody = await _req.json().catch(() => null);
        if (rawBody === null || !validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
            return ApiResponse.error(badRequest('Payload too deep or large'), 400);
        }
        const parsed = idArraySchema.safeParse(sanitizeJsonField(rawBody));
    if (!parsed.success) {
        return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues), 400);
    }
    const { ids } = parsed.data;

        const result = await AdminEngine.deleteQuestionsBatch(ids, auth.userId!);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return ApiResponse.error(internalError(message), 500);
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'batch_delete_questions' });
