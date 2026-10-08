import { METRICS } from '@quiz/observability';
import { JobStatus, JobType } from '@quiz/types';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { JobsService } from '@/modules/system/jobs.service';
import { jobSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function getHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    await requireAdminRouteAccess(_req);
    
    const { searchParams } = new URL(_req.url);
    const status = searchParams.get('status') as JobStatus | undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const cursorId = searchParams.get('cursorId');
    const cursorCreatedAt = searchParams.get('cursorCreatedAt');

    const hasCursor =
      cursorId !== null &&
      cursorId !== undefined &&
      cursorId !== '' &&
      cursorCreatedAt !== null &&
      cursorCreatedAt !== undefined &&
      cursorCreatedAt !== '';

    const { items, total, nextCursor, hasNextPage } = await JobsService.listJobs({
      status,
      limit,
      cursor: hasCursor ? { id: cursorId, createdAt: cursorCreatedAt } : undefined
    });

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.list.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.list.duration', durationMs, { outcome: 'success' });

    return ApiResponse.success({ 
      items, 
      total,
      nextCursor,
      hasNextPage
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.list.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.list.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

async function postHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _payload = await requireAdminRouteAccess(_req);
    const rawBody = await _req.json().catch(() => null);
    if (rawBody === null || !validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'), 400);
    }
    const sanitized = sanitizeJsonField(rawBody);
    const parsed = jobSchema.safeParse(sanitized);
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues), 400);
    }
    const _body = parsed.data;
    const _type = _body.type?.trim();

    if (_type === undefined || _type === null || _type === '') {
        return ApiResponse.error(badRequest('Job type is required'), 400);
    }

    const rawBodySize = JSON.stringify(_body).length;
    if (rawBodySize > 100_000) {
        return ApiResponse.error(badRequest('Payload too large (max 100KB)'), 413);
    }

    const activeCount = await JobsService.getActiveJobCount(_payload.userId);
    if (activeCount >= 20) {
        return ApiResponse.error(badRequest('Rate limit exceeded: You have 20 active jobs. Please wait for them to complete.'), 429);
    }

    const _job = await JobsService.createJob({
      userId: _payload.userId,
      type: _type,
      payload: _body.payload,
    });

    if (_body.type === JobType.MOCK_JOB) {
        const allowMock = process.env.ALLOW_MOCK_JOBS === 'true' || process.env.NODE_ENV !== 'production';
        if (allowMock) {
            void JobsService.simulateJob(_job.id, _payload.userId);
        }
    } else {
        void JobOrchestrator.runJob(_job.id, _payload.userId);
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.create.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.create.duration', durationMs, { outcome: 'success' });

    return ApiResponse.success({ job: _job }, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.create.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_jobs' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_job' }));
