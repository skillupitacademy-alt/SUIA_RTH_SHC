import type { NextRequest } from 'next/server';

import { internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { FeatureFlagService } from '@/lib/feature-flags';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'admin' });
    if (typeof token !== 'string' || token.trim().length === 0) {
      return ApiResponse.error(unauthorized('Unauthorized'), 401);
    }
    await container.get(TokenService).verifyAdminAccessToken(token);

    const response = ApiResponse.success({
      flags: FeatureFlagService.getAll(),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });

    return withCacheHeaders(response, 'SESSION');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return ApiResponse.error(internalError(message), 500);
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_feature_flags' });
