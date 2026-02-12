import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import type { DomainInsert } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { _verifyAdmin } from '@/modules/auth/rbac.service';

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

    if (!(await _verifyAdmin(_payload))) {
      return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
    }

    const body = await _req.json() as Partial<DomainInsert>;
    const result = await AdminEngine.updateDomain(id, body, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_DOMAIN_PATCH] Error:', message);
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

    const result = await AdminEngine.deleteDomain(id, _payload.userId);
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_DOMAIN_DELETE] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
