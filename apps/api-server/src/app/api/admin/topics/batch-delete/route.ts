import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

type BatchDeleteBody = { ids: string[] };

const log = logger.child({ module: 'admin:topics:batch-delete' });

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return { _error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const _payload = await TokenService.verifyAccessToken(_token, true);
        return { userId: _payload.userId };
    } catch {
        return { _error: 'Unauthorized', status: 401 };
    }
}

async function handler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const { ids } = await _req.json() as BatchDeleteBody;
        if (ids === null || ids === undefined || !Array.isArray(ids)) {
            return NextResponse.json({ _error: 'Invalid IDs' }, { status: 400 });
        }

        const result = await AdminEngine.deleteTopicsBatch(ids, auth.userId!);
        recordCounter('admin.api.topics.batch_delete.success', 1);
        recordTimer('admin.api.topics.batch_delete.duration', Date.now() - start);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        log.error({ error: message }, 'ADMIN_TOPICS_BATCH_DELETE failed');
        recordCounter('admin.api.topics.batch_delete.failure', 1, { reason: 'internal_error' });
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'batch_delete_topics' });
