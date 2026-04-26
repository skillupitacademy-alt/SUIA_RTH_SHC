import { validateBrandOrThrow } from '@quiz/auth';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { CacheManager } from '@/lib/cache-manager';
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
    
    // 🔥 SECURITY FIX: Validate brand context (defense in depth)
    try {
      validateBrandOrThrow({ brand: _payload?.brand, userId: _payload?.userId }, _req);
    } catch (brandError) {
      console.error('[Dashboard Breakdown] Brand validation failed:', brandError);
      return ApiResponse.error({
        code: 'BRAND_MISMATCH',
        message: brandError instanceof Error ? brandError.message : 'Brand validation failed',
      }, 403);
    }
    
    const range = _req.nextUrl.searchParams.get('range') ?? '28d';
    const validRanges = ['7d', '14d', '28d', '90d'];
    if (!validRanges.includes(range)) {
        return ApiResponse.error(badRequest('Invalid range parameter'), 400);
    }

    // Use specialized breakdown cache
    const cached = CacheManager.getBreakdown(_payload.userId, range);
    if (cached !== null && cached !== undefined) {
      return ApiResponse.success(cached, 200, { 'X-Cache': 'HIT', 'X-Duration-Ms': (Date.now() - start).toString() });
    }

    const data = await DashboardEngine.getPerformanceBreakdown(_payload.userId, range);
    
    const durationMs = Date.now() - start;
    CacheManager.setBreakdown(_payload.userId, range, data);

    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.breakdown.duration', durationMs, { outcome: 'success', range });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.breakdown.success', 1, { range });

    return ApiResponse.success(data, 200, { 'X-Cache': 'MISS', 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.breakdown.failure', 1);
    return ApiResponse.error(internalError(message), 500);
  }
}

export const GET = withLogging(handler, { component: 'dashboard', operation: 'get_breakdown' });
