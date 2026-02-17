import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { skillSchema } from '@/schemas/hierarchy.schemas';

const log = logger.child({ module: 'admin:skills:id' });

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const _payload = await TokenService.verifyAccessToken(_token, true);

    const rawBody = await _req.json();
    const parsed = skillSchema.partial().safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;
    const result = await AdminEngine.updateSkill(id, body, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ id: (await params).id, error: message }, 'ADMIN_SKILL_PATCH failed');
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const _payload = await TokenService.verifyAccessToken(_token, true);

    if (!(await _verifyAdmin(_payload))) {
      return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
    }

    const result = await AdminEngine.deleteSkill(id, _payload.userId);
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ id: (await params).id, error: message }, 'ADMIN_SKILL_DELETE failed');
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
