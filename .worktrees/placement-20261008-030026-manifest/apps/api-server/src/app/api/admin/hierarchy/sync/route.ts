import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type BulkSyncAuthSource = 'internal' | 'admin';

async function authorizeBulkSync(req: NextRequest): Promise<BulkSyncAuthSource> {
  const internalKeyHeader = req.headers.get('x-internal-key') ?? '';
  const internalSecret = process.env.INTERNAL_API_KEY ?? '';

  if (internalSecret.length > 0 && internalKeyHeader === internalSecret) {
    return 'internal';
  }

  await requireAdminRouteAccess(req);

  return 'admin';
}

async function handler(req: NextRequest) {
  const startedAt = Date.now();

  try {
    const authSource = await authorizeBulkSync(req);
    const summary = await HierarchySyncService.syncAll();
    const durationMs = Date.now() - startedAt;

    return ApiResponse.success(
      {
        ...summary,
        authSource,
      },
      200,
      {
        'X-Duration-Ms': durationMs.toString(),
      },
    );
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const POST = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'hierarchy_sync_bulk' }));
