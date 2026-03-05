import type { NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:users' });

async function getHandler(_req: NextRequest) {
    const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token === '') {
      throw unauthorized('Unauthorized', 'UNAUTHORIZED');
    }
    await TokenService.verifyAccessToken(_token, true);
    
    const searchParams = _req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
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

    const result = await AdminEngine.getUsers(page, limit, status, { search, role, isBlocked, isVerified, status: xStatus });
    const durationMs = Date.now() - start;
    recordCounter('admin.api.users.get.success', 1);
    recordTimer('admin.api.users.get.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.paginated(result.users, result.total, page, limit);
  } catch (_error: unknown) {
    const durationMs = Date.now() - start;
    log.error({ error: _error }, 'ADMIN_USERS failed');
    recordCounter('admin.api.users.get.failure', 1, { reason: 'internal_error' });
    recordTimer('admin.api.users.get.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_users' });
