import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
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

export async function GET(req: NextRequest) {
  try {
    // 1. Identity Verification
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "time-boxplot");

    // 2. Redis Cache
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. SQL Query for Percentiles
    // Using timeTakenSeconds as specified, but with a fallback to timeSpentSeconds if data exists
    const [stats] = (await sql`
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

    // 4. Transform for ECharts
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

    // 5. Cache result
    try {
      if (result.data.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.USER_PERSONAL });
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Time Boxplot API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch time distribution", message },
      { status: 500 }
    );
  }
}
