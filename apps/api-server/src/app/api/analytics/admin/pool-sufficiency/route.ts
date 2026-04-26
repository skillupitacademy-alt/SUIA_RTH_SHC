import { RBACService, validateBrandOrThrow } from '@quiz/auth';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import type { Role } from '@quiz/auth/rbac/roles';
import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { forbidden, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { getAuthContext } from "@/lib/auth-context";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';
import { ResilienceService } from "@/modules/core/resilience.service";

export const dynamic = "force-dynamic";

interface PoolTotalRow {
  total_available: number;
}

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    if (!(await ResilienceService.isFeatureEnabled('analytics'))) {
      return ApiResponse.error(new Error("Analytics service is busy"), 503);
    }

    // Get auth context
    const auth = await getAuthContext(req);
    if (!auth) {
      throw unauthorized("Authentication required");
    }

    // 🔥 SECURITY FIX: Validate brand context (defense in depth)
    try {
      validateBrandOrThrow(auth, req);
    } catch (brandError) {
      console.error('[Analytics Pool Sufficiency] Brand validation failed:', brandError);
      return ApiResponse.error({
        code: 'BRAND_MISMATCH',
        message: brandError instanceof Error ? brandError.message : 'Brand validation failed',
      }, 403);
    }

    // RBAC check
    const roles = (Array.isArray(auth.roles) ? auth.roles : [])
      .map((r: string) => typeof r === 'string' ? r.toLowerCase() : null)
      .filter((r): r is Role => r !== null) as Role[];
    
    if (!RBACService.hasPermission(roles, PERMISSIONS.ANALYTICS_VIEW)) {
        throw forbidden("Insufficient permissions");
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.ADMIN("pool-sufficiency");

    try {
        const cachedData = await redis.get(CACHE_KEY);
        if (cachedData !== null) {
            return ApiResponse.success(cachedData);
        }
    } catch (__redisError) {
        // Ignored
    }

    const [stats] = (await sqlReplica`
      SELECT COALESCE(SUM(available_questions), 0) AS total_available
      FROM mv_question_pool;
    `) as [PoolTotalRow | undefined];

    const available = stats !== undefined && stats !== null ? Number(stats.total_available) : 0;
    const required = 500;
    const percent = Math.min(100, Math.floor((available / required) * 100));

    const result = {
        available,
        required,
        percent
    };

    try {
        await redis.set(CACHE_KEY, result, { ex: 1800 });
    } catch (__redisError) {
        // Ignored
    }

    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.pool_sufficiency', durationMs, { outcome: 'success' });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.pool_sufficiency.count', 1, { outcome: 'success' });
    return ApiResponse.success(result, 200, {
        'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.pool_sufficiency.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.pool_sufficiency.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'analytics', operation: 'get_pool_sufficiency' });
