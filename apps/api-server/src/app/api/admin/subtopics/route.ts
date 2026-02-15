import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SubtopicInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const _payload = await TokenService.verifyAccessToken(_token, true);

    const searchParams = _req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const topicId = searchParams.get('topicId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const data = await AdminEngine.getSubtopics(page, limit, { topicId, search });
    return NextResponse.json(data);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_SUBTOPICS_GET] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);

    if (!(await _verifyAdmin(_payload))) {
        return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
    }

    const body = await _req.json() as SubtopicInsert;
    const result = await AdminEngine.createSubtopic(body, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_SUBTOPICS_POST] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

