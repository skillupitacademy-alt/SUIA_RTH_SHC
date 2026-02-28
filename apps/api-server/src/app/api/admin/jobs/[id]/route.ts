import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { JobsService } from '@/modules/system/jobs.service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handler(_req: NextRequest, { params }: RouteParams) {
    const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);
    const { id } = await params;

    const _job = await JobsService.getJob(id, _payload.userId);

    if (_job === null || _job === undefined) {
        return NextResponse.json({ _error: 'Job not found' }, { status: 404 });
    }

    recordCounter('admin.api.jobs.get.success', 1, { jobId: id });
    recordTimer('admin.api.jobs.get.duration', Date.now() - start, { outcome: 'success' });
    return NextResponse.json({ job: _job });
  } catch (_error: unknown) {
    const _message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter('admin.api.jobs.get.failure', 1, { reason: 'internal_error' });
    return NextResponse.json({ _error: _message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_job_details' });
