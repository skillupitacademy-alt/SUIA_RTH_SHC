import { type NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { materializedViewsService } from '@/modules/maintenance/materialized-views.service';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    await requireAdminRouteAccess(req);

    // Trigger refresh of all materialized views
    // In a production environment, this might be handled by a worker to avoid timeout,
    // but for now, we'll run it directly.
    await materializedViewsService.refreshAll();

    return ApiResponse.success({ message: 'Materialized views refresh initiated' }, 200);
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'refresh_materialized_views' });
