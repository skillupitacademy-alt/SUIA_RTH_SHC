import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";
import { ResilienceService } from "@/modules/core/resilience.service";

export const dynamic = "force-dynamic";

interface MasteryTrendRow {
  exam_date: Date;
  avg_accuracy: number;
}

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    if (!(await ResilienceService.isFeatureEnabled('analytics'))) {
      return ApiResponse.error(new Error("Analytics service is busy"), 503);
    }

    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
      throw unauthorized("Authentication required");
    }

    await TokenService.verifyAccessToken(token, true);

    try {
      const cachedData = await redis.get(CACHE_KEYS.ANALYTICS.ADMIN("mastery-trend"));
      if (cachedData !== null) return ApiResponse.success(cachedData);
    } catch (__redisError) {
      // Ignored
    }

    const rows = (await sqlReplica`
      SELECT exam_date, avg_accuracy
      FROM mv_mastery_trend
      ORDER BY exam_date ASC
    `) as MasteryTrendRow[];

    const result = {
      dates: rows.map((r) => new Date(r.exam_date).toLocaleDateString()),
      accuracy: rows.map((r) => Math.round(Number(r.avg_accuracy))),
    };

    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEYS.ANALYTICS.ADMIN("mastery-trend"), result, { ex: CACHE_TTL.ADMIN_GLOBAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.mastery_trend', durationMs, { outcome: 'success' });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.mastery_trend.count', 1, { outcome: 'success' });
    return ApiResponse.success(result, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.mastery_trend.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.mastery_trend.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'analytics', operation: 'get_admin_mastery_trend' });
