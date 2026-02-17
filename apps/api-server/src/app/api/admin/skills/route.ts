import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import type { SkillInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { skillSchema } from '@/schemas/hierarchy.schemas';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:skills' });

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
    const search = searchParams.get('search') ?? undefined;

    const data = await AdminEngine.getSkills(page, limit, { search });
    return NextResponse.json(data);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ error: message }, 'ADMIN_SKILLS_GET failed');
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
    const parsed = skillSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    const createBody: SkillInsert = {
      name: body.name,
      category: body.category,
      mappingType: body.mappingType,
      weight: body.weight,
    };

    const result = await AdminEngine.createSkill(createBody, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ error: message }, 'ADMIN_SKILLS_POST failed');
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
