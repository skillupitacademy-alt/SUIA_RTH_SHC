import type { NextRequest } from 'next/server';

import { internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return ApiResponse.error(unauthorized('Unauthorized'), 401);
    }

    const _payload = await container.get(TokenService).verifyUserAccessToken(_token);
    const data = await DashboardEngine.getPerformanceBreakdownMetadata(_payload.userId);
    
    const durationMs = Date.now() - start;
    recordTimer('dashboard.api.metadata.duration', durationMs, { outcome: 'success' });
    recordCounter('dashboard.api.metadata.count', 1, { outcome: 'success' });

    return ApiResponse.success(data, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter('dashboard.api.metadata.count', 1, { outcome: 'failure' });
    return ApiResponse.error(internalError(message), 500);
  }
}

export const GET = withLogging(handler, { component: 'dashboard', operation: 'get_metadata' });
