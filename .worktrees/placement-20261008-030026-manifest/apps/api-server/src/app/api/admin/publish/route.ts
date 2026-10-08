import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminQuestionEngine } from '@/modules/admin-engine/admin.engine';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { publishSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function postHandler(_req: NextRequest) {
    const start = Date.now();
    try {
        const auth = await requireAdminRouteAccess(_req);
        const rawBody = await _req.json();

        if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
          return ApiResponse.error(badRequest('Payload too deep or large'));
        }

        const sanitizedBody = sanitizeJsonField(rawBody);
        const parsed = publishSchema.safeParse(sanitizedBody);
        
        if (!parsed.success) {
            return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
        }
        
        const result = await AdminQuestionEngine.publishQuestion(parsed.data.id, auth.userId!);
        
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { outcome: 'success' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { outcome: 'success' });
        
        return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
    } catch (_error: unknown) {
        const durationMs = Date.now() - start;
        recordCounter(METRICS.ADMIN.PUBLISH, 1, { outcome: 'failure' });
        recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { outcome: 'failure' });
        return ApiResponse.error(_error);
    }
}

export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'publish_question' }));
