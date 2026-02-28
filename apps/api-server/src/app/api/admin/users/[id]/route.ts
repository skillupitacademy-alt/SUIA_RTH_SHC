import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import type { UpdateUserInput } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { updateUserSchema } from '@/schemas/admin.schemas';

const log = logger.child({ module: 'admin:users:id' });

async function patchHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const start = Date.now();
  try {
    const { id } = await params;
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const _payload = await TokenService.verifyAccessToken(_token, true);

    const rawBody = await _req.json() as UpdateUserInput;
    const parsed = updateUserSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    const result = await AdminEngine.updateUser(id, body, _payload.userId);
    recordCounter('admin.api.users.patch.success', 1, { targetUserId: id });
    recordTimer('admin.api.users.patch.duration', Date.now() - start, { outcome: 'success' });
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ id: (await params).id, error: message }, 'ADMIN_USER_PATCH failed');
    recordCounter('admin.api.users.patch.failure', 1, { targetUserId: (await params).id });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const start = Date.now();
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

    const result = await AdminEngine.deleteUser(id, _payload.userId);
    recordCounter('admin.api.users.delete.success', 1, { targetUserId: id });
    recordTimer('admin.api.users.delete.duration', Date.now() - start, { outcome: 'success' });
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ id: (await params).id, error: message }, 'ADMIN_USER_DELETE failed');
    recordCounter('admin.api.users.delete.failure', 1, { targetUserId: (await params).id });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export const PATCH = withLogging(patchHandler, { component: 'admin', operation: 'update_user' });
export const DELETE = withLogging(deleteHandler, { component: 'admin', operation: 'delete_user' });
