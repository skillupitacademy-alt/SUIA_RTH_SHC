import type { NextRequest } from 'next/server';

import { notFound } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { JobsService } from '@/modules/system/jobs.service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handler(_req: NextRequest, { params }: RouteParams) {
    const start = Date.now();
  try {
    const _payload = await requireAdminRouteAccess(_req);
    const { id } = await params;

    const _job = await JobsService.getJob(id, _payload.userId);

    if (_job === null || _job === undefined) {
        return ApiResponse.error(notFound('Job', id), 404);
    }

    recordCounter('admin.api.jobs.get.success', 1, { jobId: id });
    recordTimer('admin.api.jobs.get.duration', Date.now() - start, { outcome: 'success' });
    return ApiResponse.success({ job: _job });
  } catch (_error: unknown) {
    recordCounter('admin.api.jobs.get.failure', 1, { reason: 'internal_error' });
    return ApiResponse.error(_error);
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_job_details' });
