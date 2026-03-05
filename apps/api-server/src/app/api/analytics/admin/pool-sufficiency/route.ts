import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { forbidden, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS } from "@/modules/analytics/analytics.constants";
import { verifyAdminOrInfraToken } from "@/modules/auth/admin-audience.util";
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

    const { payload } = await verifyAdminOrInfraToken(req);
    // verifyAdminOrInfraToken might throw if no token, but let's be safe
    if (payload === null || payload === undefined) {
        throw unauthorized("Authentication required");
    }

    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
        (role: string) => role === "ADMIN" || role === "SUPER_ADMIN"
    );

    if (!hasAdminRole && payload.isAdmin !== true) {
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
