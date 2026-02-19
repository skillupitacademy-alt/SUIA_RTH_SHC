
import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

// Standard TTL used via ANALYTICS_CACHE.USER_PERSONAL

export async function GET(req: NextRequest) {
  try {
    // 1. Identity Extraction (No query params allowed)
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "score-history");

    // 2. Redis Cache-Aside Strategy
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) return NextResponse.json(cachedData);
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. Query Personal Score History (Chronological)
    const rows = (await sql`
      SELECT
        DATE(completed_at) AS exam_date,
        total_score
      FROM exams
      WHERE user_id = ${userId}
        AND status = 'completed'
        AND total_score IS NOT NULL
      ORDER BY completed_at ASC
      LIMIT 10
    `) as { exam_date: string; total_score: number }[];

    // 4. ECharts-Ready Transformation
    const result = {
      dates: rows.map((r) => new Date(r.exam_date).toLocaleDateString()),
      scores: rows.map((r) => Number(r.total_score)),
    };

    // 5. Fire-and-Forget Cache Backfill
    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.USER_PERSONAL });
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Personal Score History Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch score history", message },
      { status: 500 }
    );
  }
}
