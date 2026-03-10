import { type NextRequest } from 'next/server';

import { forbidden,unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { materializedViewsService } from '@/modules/maintenance/materialized-views.service';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'admin' });
    if (token === null || token === undefined || token === '') throw unauthorized('Unauthorized');

    await container.get(TokenService).verifyAdminAccessToken(token);

    // Trigger refresh of all materialized views
    // In a production environment, this might be handled by a worker to avoid timeout,
    // but for now, we'll run it directly.
    await materializedViewsService.refreshAll();

    return ApiResponse.success({ message: 'Materialized views refresh initiated' }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Forbidden';
    return ApiResponse.error(forbidden(message), 403);
  }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'refresh_materialized_views' });
