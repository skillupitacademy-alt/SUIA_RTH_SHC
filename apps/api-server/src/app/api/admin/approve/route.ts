import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminQuestionEngine } from "@/modules/admin-engine/admin.question.engine";
import { verifyAdminOrInfraToken } from '@/modules/auth/admin-audience.util';
import { publishSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type ApproveBody = { id: string };
type VerifyResult =
    | { userId: string; scope: string }
    | { _error: string; status: number; scope?: string };

async function _verifyAdmin(_req: NextRequest): Promise<VerifyResult> {
    try {
        const { payload, audience } = await verifyAdminOrInfraToken(_req);
        return { userId: payload.userId, scope: audience };
    } catch {
        return { _error: 'Unauthorized', status: 401, scope: 'admin' };
    }
}

async function handler(_req: NextRequest) {
    const start = Date.now();
    const auth = await _verifyAdmin(_req);
    if ('_error' in auth) {
        return ApiResponse.error(unauthorized(auth._error ?? 'Unauthorized'), auth.status);
    }

    try {
        const rawBody = await _req.json() as unknown;
        const parsed = publishSchema.safeParse(rawBody);
        if (!parsed.success) {
            return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues), 400);
        }
        const body = parsed.data as ApproveBody;
        const result = await AdminQuestionEngine.publishQuestion(body.id, auth.userId);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'approve', outcome: 'success' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { action: 'approve', outcome: 'success' });
        
        return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'approve', outcome: 'failure' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { action: 'approve', outcome: 'failure' });
        return ApiResponse.error(internalError(message), 500);
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'approve_question' });
