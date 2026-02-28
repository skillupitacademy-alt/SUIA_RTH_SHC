import { METRICS } from '@quiz/observability';
import { JobStatus, JobType } from '@quiz/types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { JobsService } from '@/modules/system/jobs.service';
import { jobSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function getHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    await TokenService.verifyAccessToken(_token, true);
    
    const { searchParams } = new URL(_req.url);
    const status = searchParams.get('status') as JobStatus | undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const { items, total } = await JobsService.listJobs({
      status,
      limit,
      offset
    });

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.list.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.list.duration', durationMs, { outcome: 'success' });

    return NextResponse.json({ items, total }, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    const _message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.list.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.list.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: _message }, { status: 500 });
  }
}

async function postHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);
    const rawBody = await _req.json();
    const parsed = jobSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const _body = parsed.data;
    const _type = _body.type?.trim();

    if (_type === undefined || _type === null || _type === '') {
        return NextResponse.json({ _error: 'Job type is required' }, { status: 400 });
    }

    const rawBodySize = JSON.stringify(_body).length;
    if (rawBodySize > 100_000) {
        return NextResponse.json({ _error: 'Payload too large (max 100KB)' }, { status: 413 });
    }

    const activeCount = await JobsService.getActiveJobCount(_payload.userId);
    if (activeCount >= 20) {
        return NextResponse.json({ 
            _error: 'Rate limit exceeded: You have 20 active jobs. Please wait for them to complete.' 
        }, { status: 429 });
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

    return NextResponse.json({ job: _job }, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    const _message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.jobs.create.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: _message }, { status: 500 });
  }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'list_jobs' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'create_job' });
