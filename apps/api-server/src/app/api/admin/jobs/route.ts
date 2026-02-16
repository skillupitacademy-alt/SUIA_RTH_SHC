import { JobStatus, JobType } from '@quiz/types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { JobsService } from '@/modules/system/jobs.service';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);
    
    const { searchParams } = new URL(_req.url);
    const status = searchParams.get('status') as JobStatus | undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const { items, total } = await JobsService.listJobs({
      status,
      limit,
      offset
    });

    return NextResponse.json({ items, total });
  } catch (_error: unknown) {
    const _message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return NextResponse.json({ _error: _message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);
    const _body = await _req.json() as { type: string; payload?: Record<string, unknown> };
    const _type = _body.type?.trim();

    if (_type === undefined || _type === null || _type === '') {
        return NextResponse.json({ _error: 'Job type is required' }, { status: 400 });
    }

    // Payload size guard: ~100 KB
    const rawBodySize = JSON.stringify(_body).length;
    if (rawBodySize > 100_000) {
        return NextResponse.json({ _error: 'Payload too large (max 100KB)' }, { status: 413 });
    }

    // Rate Limit Check (Max 20 active jobs per user for admin - increased from 5)
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

    // Dispatch for execution
    if (_body.type === JobType.MOCK_JOB) {
        const allowMock = process.env.ALLOW_MOCK_JOBS === 'true' || process.env.NODE_ENV !== 'production';
        if (allowMock) {
            void JobsService.simulateJob(_job.id, _payload.userId);
        }
    } else {
        // Phase 10 & 11: Unified Orchestration
        void JobOrchestrator.runJob(_job.id, _payload.userId);
    }

    return NextResponse.json({ job: _job });
  } catch (_error: unknown) {
    const _message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return NextResponse.json({ _error: _message }, { status: 500 });
  }
}
