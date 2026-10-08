import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { FeatureFlagService } from '@/lib/feature-flags';
import { withLogging } from '@/lib/withLogging';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    await requireAdminRouteAccess(req);

    const response = ApiResponse.success({
      flags: FeatureFlagService.getAll(),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });

    return withCacheHeaders(response, 'SESSION');
  } catch (error) {
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_feature_flags' });
