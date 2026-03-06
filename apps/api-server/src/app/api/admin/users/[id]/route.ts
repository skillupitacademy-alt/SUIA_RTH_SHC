import { db } from '@quiz/db';
import type { NextRequest } from 'next/server';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminUserEngine } from "@/modules/admin-engine/admin.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { updateUserSchema } from '@/schemas/admin.schemas';

const log = logger.child({ module: 'admin:users:id' });

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token === '') {
        throw unauthorized('Unauthorized', 'UNAUTHORIZED');
    }
    return await container.get(TokenService).verifyAccessToken(_token, true);
}

async function getHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const start = Date.now();
    try {
        const { id } = await params;
        await verifyAdmin(_req);
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, id),
            with: {
                profile: true,
                userRoles: {
                    with: {
                        role: true
                    }
                }
            }
        });
        if (!user) {
            recordCounter('admin.api.users.get.failure', 1, { targetUserId: id, reason: 'not_found' });
            recordTimer('admin.api.users.get.duration', Date.now() - start, { outcome: 'failure' });
            return ApiResponse.error(notFound('User', id));
        }
        recordCounter('admin.api.users.get.success', 1, { targetUserId: id });
        recordTimer('admin.api.users.get.duration', Date.now() - start, { outcome: 'success' });
        return ApiResponse.success(user);
    } catch (_error: unknown) {
        const id = (await params).id;
        log.error({ id, error: _error }, 'ADMIN_USER_GET failed');
        recordCounter('admin.api.users.get.failure', 1, { targetUserId: id, reason: 'exception' });
        recordTimer('admin.api.users.get.duration', Date.now() - start, { outcome: 'failure' });
        return ApiResponse.error(_error);
    }
}

async function patchHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const start = Date.now();
  try {
    const { id } = await params;
    const _payload = await verifyAdmin(_req);

    const rawBody = await _req.json();
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      recordCounter('admin.api.users.patch.failure', 1, { targetUserId: id, reason: 'invalid_payload_size_depth' });
      recordTimer('admin.api.users.patch.duration', Date.now() - start, { outcome: 'failure' });
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = updateUserSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
      recordCounter('admin.api.users.patch.failure', 1, { targetUserId: id, reason: 'invalid_payload_schema' });
      recordTimer('admin.api.users.patch.duration', Date.now() - start, { outcome: 'failure' });
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data;

    const result = await AdminUserEngine.updateUser(id, body, _payload.userId);
    recordCounter('admin.api.users.patch.success', 1, { targetUserId: id });
    recordTimer('admin.api.users.patch.duration', Date.now() - start, { outcome: 'success' });
    
    return ApiResponse.success(result);
  } catch (_error: unknown) {
    const id = (await params).id;
    log.error({ id, error: _error }, 'ADMIN_USER_PATCH failed');
    recordCounter('admin.api.users.patch.failure', 1, { targetUserId: id, reason: 'exception' });
    recordTimer('admin.api.users.patch.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  try {
    const { id } = await params;
    const auth = await verifyAdmin(_req);

    const result = await AdminUserEngine.deleteUser(id, auth.userId!);
    recordCounter('admin.api.users.delete.success', 1, { targetUserId: id });
    recordTimer('admin.api.users.delete.duration', Date.now() - start, { outcome: 'success' });
    return ApiResponse.success(result);
  } catch (_error: unknown) {
    const id = (await params).id;
    log.error({ id, error: _error }, 'ADMIN_USER_DELETE failed');
    recordCounter('admin.api.users.delete.failure', 1, { targetUserId: id });
    return ApiResponse.error(_error);
  }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_user' });
export const PATCH = withLogging(patchHandler, { component: 'admin', operation: 'update_user' });
export const DELETE = withLogging(deleteHandler, { component: 'admin', operation: 'delete_user' });
