import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { TopicInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { topicSchema } from '@/schemas/hierarchy.schemas';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    await TokenService.verifyAccessToken(_token, true);

    const searchParams = _req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const subjectId = searchParams.get('subjectId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const data = await AdminEngine.getTopics(page, limit, { subjectId, search });
    return NextResponse.json(data);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_TOPICS_GET] Error:', message);
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

    const rawBody = await _req.json();
    const parsed = topicSchema.safeParse(rawBody);
    const body = parsed.success ? parsed.data : (rawBody as Partial<typeof topicSchema['_input']>);

    if (typeof body.subjectId !== 'string' || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ _error: 'subjectId and name are required' }, { status: 400 });
    }

    const createBody: TopicInsert = {
      subjectId: body.subjectId,
      name: body.name,
      description: body.description,
      status: body.status,
      complexityLevel: body.complexityLevel,
      weight: body.weight,
    };

    const result = await AdminEngine.createTopic(createBody, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_TOPICS_POST] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
