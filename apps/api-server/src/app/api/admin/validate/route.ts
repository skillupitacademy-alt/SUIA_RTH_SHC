import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminTopicEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { validateTopicSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type ValidateBody = { topicId: string };

async function handler(_req: NextRequest) {
  const start = Date.now();
  
  try {
    await requireAdminRouteAccess(_req);

    const rawBody = await _req.json() as ValidateBody;
    const parsed = validateTopicSchema.safeParse(rawBody);
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues), 400);
    }
    const { topicId } = parsed.data;
    const result = await AdminTopicEngine.validateTopic(topicId);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.validate.success', 1, { topicId });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.validate.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.validate.failure', 1, { reason: 'error' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.validate.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const POST = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'validate_topic' }));
