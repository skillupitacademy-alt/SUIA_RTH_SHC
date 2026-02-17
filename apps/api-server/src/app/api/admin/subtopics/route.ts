import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SubtopicInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { subtopicSchema } from '@/schemas/hierarchy.schemas';

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

    const rawBody = await _req.json();
    const parsed = subtopicSchema.safeParse(rawBody);
    const body = parsed.success ? parsed.data : (rawBody as Partial<typeof subtopicSchema['_input']>);

    if (typeof body.topicId !== 'string' || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ _error: 'topicId and name are required' }, { status: 400 });
    }

    const createBody: SubtopicInsert = {
      topicId: body.topicId,
      name: body.name,
      description: body.description,
      depthLevel: body.depthLevel,
    };

    const result = await AdminEngine.createSubtopic(createBody, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_SUBTOPICS_POST] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
