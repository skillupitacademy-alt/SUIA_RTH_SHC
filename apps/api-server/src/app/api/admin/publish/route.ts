import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminQuestionEngine } from "@/modules/admin-engine/admin.question.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { publishSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token.trim() === '') {
        throw unauthorized('Unauthorized', 'UNAUTHORIZED');
    }
    return await container.get(TokenService).verifyAccessToken(_token, true);
}

async function postHandler(_req: NextRequest) {
    const start = Date.now();
    try {
        const auth = await verifyAdmin(_req);
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

export const POST = withLogging(postHandler, { component: 'admin', operation: 'publish_question' });
