import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminQuestionEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { idArraySchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
    try {
        const payload = await requireAdminRouteAccess(_req);
        const rawBody = await _req.json().catch(() => null);
        if (rawBody === null || !validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
            return ApiResponse.error(badRequest('Payload too deep or large'), 400);
        }
        const parsed = idArraySchema.safeParse(sanitizeJsonField(rawBody));
    if (!parsed.success) {
        return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues), 400);
    }
    const { ids } = parsed.data;

        const result = await AdminQuestionEngine.deleteQuestionsBatch(ids, payload.userId);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'batch_delete_questions' });
