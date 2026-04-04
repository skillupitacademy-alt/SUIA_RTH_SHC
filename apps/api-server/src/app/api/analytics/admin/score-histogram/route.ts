import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { forbidden, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';
import { ResilienceService } from "@/modules/core/resilience.service";

export const dynamic = "force-dynamic";

interface ScoreDistributionRow {
  score_bucket: number;
  student_count: number;
}

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    if (!(await ResilienceService.isFeatureEnabled('analytics'))) {
      return ApiResponse.error(new Error("Analytics service is busy"), 503);
    }

    const token = container.get(TokenService).getAccessToken(req, { scope: "admin" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Authentication required");
    }

    const payload = await container.get(TokenService).verifyAdminAccessToken(token);
    if (payload === null || payload === undefined) {
      throw unauthorized("Authentication required");
    }
    
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "admin" || role === "super_admin"
    );
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      throw forbidden("Insufficient permissions");
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.ADMIN("score-histogram");

    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return ApiResponse.success(cachedData);
      }
    } catch (__redisError) {
      // Ignored
    }

    const rows = (await sqlReplica`
      SELECT score_bucket, student_count
      FROM mv_score_distribution
      ORDER BY score_bucket
    `) as ScoreDistributionRow[];

    const counts = new Array(10).fill(0);
    for (const row of rows) {
      const bucketIdx = Math.min(row.score_bucket, 9);
      counts[bucketIdx] += Number(row.student_count);
    }

    const result = {
      bins: counts.map((_, i) => `B${i}`),
      counts: counts,
    };

    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.ADMIN_GLOBAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.score_histogram', durationMs, { outcome: 'success' });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.score_histogram.count', 1, { outcome: 'success' });
    return ApiResponse.success(result, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.score_histogram.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.score_histogram.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'analytics', operation: 'get_score_histogram' });
