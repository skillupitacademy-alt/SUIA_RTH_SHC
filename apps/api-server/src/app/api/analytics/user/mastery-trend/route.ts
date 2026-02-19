
import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

// Standard TTL used via ANALYTICS_CACHE.USER_PERSONAL

interface UserMasteryTrendRow {
  exam_date: string;
  avg_accuracy: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Auth & Identity
    const token = TokenService.getAccessToken(req, { scope: "_user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "mastery-trend");

    // 2. Try Redis
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) return NextResponse.json(cachedData);
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. Query Personal Mastery Trend
    // Aggregates accuracy per day for the specific user
    const rows = (await sql`
      SELECT 
        DATE(created_at) AS exam_date,
        AVG(accuracy) AS avg_accuracy
      FROM results_by_dimension
      WHERE exam_id IN (SELECT id FROM exams WHERE user_id = ${userId})
      GROUP BY DATE(created_at)
      ORDER BY exam_date ASC
    `) as UserMasteryTrendRow[];

    // 4. Transform for ECharts
    const result = {
      dates: rows.map((r) => new Date(r.exam_date).toLocaleDateString()),
      accuracy: rows.map((r) => Math.round(Number(r.avg_accuracy))),
    };

    // 5. Cache
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
    console.error("[User Mastery Trend Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal mastery trend", message },
      { status: 500 }
    );
  }
}
