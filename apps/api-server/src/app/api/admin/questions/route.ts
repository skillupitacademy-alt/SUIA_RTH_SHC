import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { CreateQuestionInput } from '@/modules/admin-engine/admin.engine';
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

    if (!(await _verifyAdmin(_payload))) {
        console.warn(`[ADMIN_QUESTIONS] Forbidden: User ${_payload.userId} lacks admin role.`);
        return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
    }
    
    const searchParams = _req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    
    const filters = {
        domainId: searchParams.get('domainId') ?? undefined,
        subjectId: searchParams.get('subjectId') ?? undefined,
        topicId: searchParams.get('topicId') ?? undefined,
        subtopicId: searchParams.get('subtopicId') ?? undefined,
        skillIds: searchParams.getAll('skillIds').length > 0 ? searchParams.getAll('skillIds') : undefined,
        status: searchParams.get('status') ?? undefined,
        search: searchParams.get('search') ?? undefined,
    };

    const data = await AdminEngine.getQuestions(page, limit, filters);
    return NextResponse.json(data);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_QUESTIONS] Error:', message);
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

    const body = await _req.json() as CreateQuestionInput;
    const result = await AdminEngine.createQuestion(body, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_QUESTIONS_POST] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

