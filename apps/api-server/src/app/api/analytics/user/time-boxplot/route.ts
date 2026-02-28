import { METRICS } from "@quiz/observability";
import { type NextRequest, NextResponse } from "next/server";

import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface BoxplotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "time-boxplot");

    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (__redisError) {
      // Ignored
    }

    const [stats] = (await sqlReplica`
      WITH user_times AS (
        SELECT
          COALESCE(
            (eq.response_metadata->>'timeTakenSeconds')::int,
            (eq.response_metadata->>'timeSpentSeconds')::int
          ) AS time_sec
        FROM exam_questions eq
        JOIN exams e ON e.id = eq.exam_id
        WHERE e.user_id = ${userId}
          AND (eq.response_metadata ? 'timeTakenSeconds' OR eq.response_metadata ? 'timeSpentSeconds')
      )
      SELECT
        percentile_cont(0.0) WITHIN GROUP (ORDER BY time_sec) AS min,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY time_sec) AS q1,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY time_sec) AS median,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY time_sec) AS q3,
        percentile_cont(1.0) WITHIN GROUP (ORDER BY time_sec) AS max
      FROM user_times
      WHERE time_sec IS NOT NULL;
    `) as [BoxplotStats | undefined];

    const result = {
      data: stats && stats.min !== null
        ? [
            Number(stats.min),
            Number(stats.q1),
            Number(stats.median),
            Number(stats.q3),
            Number(stats.max)
          ]
        : []
    };

    try {
      if (result.data.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.USER_PERSONAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.TIME_BOXPLOT, 1, { outcome: 'success' });
    recordTimer(METRICS.ANALYTICS.TIME_BOXPLOT + '.duration', durationMs, { outcome: 'success' });
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.TIME_BOXPLOT, 1, { outcome: 'failure' });
    recordTimer(METRICS.ANALYTICS.TIME_BOXPLOT + '.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json(
      { error: "Failed to fetch time distribution", message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_time_boxplot' });
