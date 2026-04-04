import type { NextRequest } from 'next/server';

import type { AdminUserInput } from '@/dtos/admin.dto';
import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { bootstrapCQRS, GetAdminUsersQuery, queryBus } from '@/lib/cqrs';
import { selectFields } from '@/lib/field-selector';
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:users' });

const USER_ADMIN_ALLOWLIST = [
  'id', 'email', 'name', 'roles', 'isVerified', 'createdAt', 'lastLoginAt', 'examCount'
];
type AdminUsersQueryResult = {
  users: unknown[];
  total: number;
  nextCursor: string | null;
  limit: number;
};

async function getHandler(_req: NextRequest) {
    const start = Date.now();
  try {
    await requireAdminRouteAccess(_req);
    
    const searchParams = _req.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const status = (searchParams.get('status') as 'active' | 'deleted') ?? 'active';
    
    // New Filters
    const search = searchParams.get('search') ?? undefined;
    const role = searchParams.get('role') ?? undefined;
    const isBlockedParam = searchParams.get('isBlocked');
    const isBlocked = isBlockedParam === 'true' ? true : isBlockedParam === 'false' ? false : undefined;
    const isVerifiedParam = searchParams.get('isVerified');
    const isVerified = isVerifiedParam === 'true' ? true : isVerifiedParam === 'false' ? false : undefined;
    const xStatus = searchParams.get('xStatus') ?? undefined;
    const fields = searchParams.get('fields');

    bootstrapCQRS();
    const result = await queryBus.dispatch(new GetAdminUsersQuery(cursor, limit, status, { search, role, isBlocked, isVerified, status: xStatus, fields: fields ?? undefined })) as AdminUsersQueryResult;
    
    const { toAdminUserDTO } = await import('@/dtos/admin.dto');
    const usersDto = selectFields(
      (result.users as unknown[]).map((user) => toAdminUserDTO(user as AdminUserInput)) as unknown as Record<string, unknown>[],
      fields,
      USER_ADMIN_ALLOWLIST
    );
    
    const durationMs = Date.now() - start;
    recordCounter('admin.api.users.get.success', 1);
    recordTimer('admin.api.users.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      data: usersDto,
      total: result.total,
      nextCursor: result.nextCursor,
      limit: result.limit
    });
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    log.error({ error: _error }, 'ADMIN_USERS failed');
    recordCounter('admin.api.users.get.failure', 1, { reason: 'internal_error' });
    recordTimer('admin.api.users.get.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

async function postHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    const auth = await requireAdminRouteAccess(_req);

    const body = await _req.json();
    const { createUserSchema } = await import('@/schemas/admin.schemas');
    const parsed = createUserSchema.safeParse(body);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }

    const { AdminUserEngine } = await import('@/modules/admin-engine/admin.user.engine');
    const engine = new AdminUserEngine();
    const result = await engine.createUser(parsed.data, auth.userId!);

    recordCounter('admin.api.users.post.success', 1);
    recordTimer('admin.api.users.post.duration', Date.now() - start, { outcome: 'success' });

    return ApiResponse.success(result);
  } catch (_error: unknown) {
    log.error({ error: _error }, 'ADMIN_USER_POST failed');
    recordCounter('admin.api.users.post.failure', 1);
    return ApiResponse.error(_error);
  }
}

export const GET = withCorrelationId(withLogging(getHandler, { component: 'admin', operation: 'get_users' }));
export const POST = withCorrelationId(withLogging(postHandler, { component: 'admin', operation: 'create_user' }));
