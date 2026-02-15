import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { JobsService } from '@/modules/system/jobs.service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
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

    return NextResponse.json({ job: _job });
  } catch (_error: unknown) {
    const _message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return NextResponse.json({ _error: _message }, { status: 500 });
  }
}
