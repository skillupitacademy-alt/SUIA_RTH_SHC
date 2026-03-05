import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, forbidden, internalError } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminTopicEngine } from "@/modules/admin-engine/admin.topic.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { validateTopicSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type ValidateBody = { topicId: string };

async function _verifyAdmin(_req: NextRequest) {
  const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
  if (_token === null || _token === undefined || _token.trim() === '') return null;
  try {
     const _payload = await container.get(TokenService).verifyAccessToken(_token, true);
     return _payload;
  } catch {
     return null;
  }
}

async function handler(_req: NextRequest) {
    const start = Date.now();
  const admin = await _verifyAdmin(_req);
  if (admin === null || admin === undefined) return ApiResponse.error(forbidden('Admin access required'), 403);

  try {
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
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.validate.failure', 1, { reason: 'internal_error' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.validate.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(internalError(message), 500);
  }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'validate_topic' });
