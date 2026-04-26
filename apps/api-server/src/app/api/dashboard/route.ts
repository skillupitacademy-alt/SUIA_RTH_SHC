import { validateBrandOrThrow, RBACService, ForbiddenError } from '@quiz/auth';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import { type NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { CacheManager } from '@/lib/cache-manager';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withObservability } from '@/middleware/observability.middleware';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest, obsCtx: any) {
  const { requestId } = obsCtx; // 🔥 Observability context
  const start = Date.now();
  
  const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
  if (token === undefined || token === null || token === '') {
    throw unauthorized("Unauthorized");
  }

  const payload = await container.get(TokenService).verifyUserAccessToken(token);
  
  // 🔥 RBAC: Enforce dashboard access permission (throws ForbiddenError if denied)
  RBACService.requirePermission(
    (payload.roles || []) as any,
    PERMISSIONS.DASHBOARD_VIEW,
    payload.userId,
    requestId
  );
  
  // 🔥 SECURITY FIX: Validate brand context (defense in depth)
  try {
    validateBrandOrThrow({ brand: payload?.brand, userId: payload?.userId }, req);
  } catch (brandError) {
    console.error('[Dashboard] Brand validation failed:', brandError);
    return ApiResponse.error({
      code: 'BRAND_MISMATCH',
      message: brandError instanceof Error ? brandError.message : 'Brand validation failed',
    }, 403);
  }
  
  const { allowed, remaining } = CacheManager.checkRateLimit(payload.userId, 60);
  if (!allowed) {
      return ApiResponse.error(new Error('Too many requests'), 429, undefined, { 
          'Retry-After': '60',
          'X-RateLimit-Remaining': remaining.toString()
      });
  }

  const range = req.nextUrl.searchParams.get('range') ?? '7d';
  const validRanges = ['7d', '14d', '28d', '90d'];
  if (!validRanges.includes(range)) {
      return ApiResponse.error(new Error('Invalid range parameter'), 400);
  }

  const from = req.nextUrl.searchParams.get('from') ?? undefined;
  const to = req.nextUrl.searchParams.get('to') ?? undefined;
  const rawPage = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10);
  const rawLimit = parseInt(req.nextUrl.searchParams.get('limit') ?? '6', 10);

  const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1);
  const limit = Math.min(Math.max(isNaN(rawLimit) ? 1 : rawLimit, 1), 50);

  if (typeof from !== 'string' && typeof to !== 'string') {
      const cached = CacheManager.getDashboard(payload.userId, range, page, limit);
      if (cached !== undefined && cached !== null) {
          recordCounter('dashboard.api.main.count', 1, { outcome: 'success', cache: 'hit', range });
          return ApiResponse.success(cached, 200, { 
              'X-Cache': 'HIT', 
              'X-RateLimit-Remaining': remaining.toString() 
          });
      }
  }

  const data = await DashboardEngine.getUserDashboard(payload.userId, range, from, to, page, limit);
  
  if (typeof from !== 'string' && typeof to !== 'string') {
      CacheManager.setDashboard(payload.userId, range, page, limit, data);
  }
  
  const durationMs = Date.now() - start;
  recordTimer('dashboard.api.main.duration', durationMs, { outcome: 'success', cache: 'miss', range });
  recordCounter('dashboard.api.main.count', 1, { outcome: 'success', cache: 'miss', range });

  return ApiResponse.success(data, 200, {
      'X-Cache': 'MISS', 
      'X-RateLimit-Remaining': remaining.toString()
  });
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const GET = withObservability(getHandler);
