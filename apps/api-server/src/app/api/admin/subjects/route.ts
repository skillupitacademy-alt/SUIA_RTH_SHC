import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import type { SubjectInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { subjectSchema } from '@/schemas/hierarchy.schemas';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:subjects' });

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
    const domainId = searchParams.get('domainId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const data = await AdminEngine.getSubjects(page, limit, { domainId, search });
    return NextResponse.json(data);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ error: message }, 'ADMIN_SUBJECTS_GET failed');
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

    const rawBody = await _req.json();
    const parsed = subjectSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    const createBody: SubjectInsert = {
      domainId: body.domainId,
      name: body.name,
      description: body.description,
      status: body.status,
      order: body.order,
    };

    const result = await AdminEngine.createSubject(createBody, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ error: message }, 'ADMIN_SUBJECTS_POST failed');
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
