import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminQuestionEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { publishSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type ApproveBody = { id: string };
async function handler(_req: NextRequest) {
    const start = Date.now();
    try {
        const auth = await requireAdminRouteAccess(_req);
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
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'approve', outcome: 'failure' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { action: 'approve', outcome: 'failure' });
        return ApiResponse.error(_error);
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'approve_question' });
