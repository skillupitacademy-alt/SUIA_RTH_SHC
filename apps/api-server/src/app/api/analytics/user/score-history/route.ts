import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { InsightEngineService } from "@/modules/analytics/insight-engine.service";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Authentication required");
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (payload === null || payload === undefined) {
      throw unauthorized("Authentication required");
    }
    const userId = payload.userId;
    if (userId === null || userId === undefined) {
      throw unauthorized("User id missing from token");
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "score-history");

    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) return ApiResponse.success(cachedData);
    } catch (__redisError) {
      // Ignored
    }

    const [rows, userProfile] = await Promise.all([
      sqlReplica`
      SELECT
        DATE(completed_at) AS exam_date,
        total_score
      FROM exams
      WHERE user_id = ${userId}
        AND status = 'completed'
        AND total_score IS NOT NULL
      ORDER BY completed_at ASC
      LIMIT 10
    ` as unknown as Promise<{ exam_date: string; total_score: number }[]>,
      sqlReplica`
      SELECT name FROM user_profiles WHERE user_id = ${userId} LIMIT 1
    ` as unknown as Promise<{ name: string }[]>
    ]);

    const userName = userProfile[0]?.name || "Student";

    const data = {
      dates: rows.map((r) => new Date(r.exam_date).toLocaleDateString()),
      scores: rows.map((r) => Number(r.total_score)),
    };

    const insight = InsightEngineService.analyzePerformanceTrend(userName, data);

    const result = {
      ...data,
      insight,
    };

    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.USER_PERSONAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.SCORE_HISTORY, 1, { outcome: 'success' });
    recordTimer(METRICS.ANALYTICS.SCORE_HISTORY + '.duration', durationMs, { outcome: 'success' });
    return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.SCORE_HISTORY, 1, { outcome: 'failure' });
    recordTimer(METRICS.ANALYTICS.SCORE_HISTORY + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'analytics', operation: 'get_score_history' });
