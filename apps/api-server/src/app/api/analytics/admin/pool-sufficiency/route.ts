import { METRICS } from "@quiz/observability";
import { type NextRequest, NextResponse } from "next/server";

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

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    if (!(await ResilienceService.isFeatureEnabled('analytics'))) {
      return NextResponse.json(ResilienceService.getBusyPayload('analytics'), { status: 503 });
    }

    const { payload } = await verifyAdminOrInfraToken(req);
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
        (role: string) => role === "ADMIN" || role === "SUPER_ADMIN"
    );

    if (!hasAdminRole && payload.isAdmin !== true) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.ADMIN("pool-sufficiency");

    try {
        const cachedData = await redis.get(CACHE_KEY);
        if (cachedData !== null) {
            return NextResponse.json(cachedData);
        }
    } catch (__redisError) {
        // Ignored
    }

    const [stats] = (await sqlReplica`
      SELECT COALESCE(SUM(available_questions), 0) AS total_available
      FROM mv_question_pool;
    `) as [PoolTotalRow | undefined];

    const available = stats ? Number(stats.total_available) : 0;
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
    return NextResponse.json(result, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.pool_sufficiency.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.pool_sufficiency.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_pool_sufficiency' });
