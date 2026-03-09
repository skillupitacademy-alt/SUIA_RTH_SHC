import type { NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminUserEngine } from "@/modules/admin-engine/admin.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:users' });

async function getHandler(_req: NextRequest) {
    const start = Date.now();
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token === '') {
      throw unauthorized('Unauthorized', 'UNAUTHORIZED');
    }
    await container.get(TokenService).verifyAdminAccessToken(_token);
    
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

    const result = await AdminUserEngine.getUsers(cursor, limit, status, { search, role, isBlocked, isVerified, status: xStatus });
    
    const { toAdminUserDTO } = await import('@/dtos/admin.dto');
    const usersDto = result.users.map(toAdminUserDTO);
    
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

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_users' });
