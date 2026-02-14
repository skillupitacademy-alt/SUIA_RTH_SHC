import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';
import { JobsService } from '@/modules/system/jobs.service';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);
    const _body = await _req.json() as { type: string; payload?: Record<string, unknown> };

    if (_body.type === null || _body.type === undefined || _body.type.trim() === '') {
        return NextResponse.json({ _error: 'Job type is required' }, { status: 400 });
    }

    const _job = await JobsService.createJob({
      userId: _payload.userId,
      type: _body.type,
      payload: _body.payload,
    });

    return NextResponse.json({ job: _job });
  } catch (_error: unknown) {
    const _message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return NextResponse.json({ _error: _message }, { status: 500 });
  }
}
