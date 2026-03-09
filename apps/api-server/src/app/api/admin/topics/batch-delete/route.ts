import type { NextRequest} from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminTopicEngine } from "@/modules/admin-engine/admin.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

type BatchDeleteBody = { ids: string[] };

const log = logger.child({ module: 'admin:topics:batch-delete' });

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token === '') {
        return { _error: unauthorized('Unauthorized', 'UNAUTHORIZED') };
    }

    try {
        const _payload = await container.get(TokenService).verifyAdminAccessToken(_token);
        return { userId: _payload.userId };
    } catch (_error) {
        return { _error: unauthorized('Unauthorized', 'UNAUTHORIZED') };
    }
}

async function handler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return ApiResponse.error(auth._error);

    try {
        const rawBody = await _req.json();
        if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
          return ApiResponse.error(badRequest('Payload too deep or large'));
        }

        const { ids } = rawBody as BatchDeleteBody;
        if (!Array.isArray(ids)) {
            return ApiResponse.error(badRequest('Invalid IDs (expected array)'));
        }

        const result = await AdminTopicEngine.deleteTopicsBatch(ids, auth.userId!);
        recordCounter('admin.api.topics.batch_delete.success', 1);
        recordTimer('admin.api.topics.batch_delete.duration', Date.now() - start);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        log.error({ error: message }, 'ADMIN_TOPICS_BATCH_DELETE failed');
        recordCounter('admin.api.topics.batch_delete.failure', 1, { reason: 'internal_error' });
        return ApiResponse.error(_error);
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'batch_delete_topics' });
