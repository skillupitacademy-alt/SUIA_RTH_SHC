import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:users' });

async function handler(_req: NextRequest) {
    const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
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

    const data = await AdminEngine.getUsers(page, limit, status, { search, role, isBlocked, isVerified, status: xStatus });
    recordCounter('admin.api.users.get.success', 1);
    recordTimer('admin.api.users.get.duration', Date.now() - start, { outcome: 'success' });
    return NextResponse.json(data);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ error: message }, 'ADMIN_USERS failed');
    recordCounter('admin.api.users.get.failure', 1, { reason: 'internal_error' });
    return NextResponse.json({ _error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_users' });
