import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface ScoreDistributionRow {
  score_bucket: number;
  student_count: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Identity & Role Verification (RBAC)
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, true);
    
    // Explicitly check role (TokenPayload has roles string array)
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "ADMIN" || role === "SUPER_ADMIN" || role === "admin"
    );
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.ADMIN("score-histogram");

    // 2. Redis Cache-Aside
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. Query Materialized View
    const rows = (await sql`
      SELECT score_bucket, student_count
      FROM mv_score_distribution
      ORDER BY score_bucket
    `) as ScoreDistributionRow[];

    // 4. Normalize to 10 buckets (0-100 / increments of 10)
    // We ensure every bucket exists to prevent chart misalignment
    const counts = new Array(10).fill(0);
    for (const row of rows) {
      const bucketIdx = Math.min(row.score_bucket, 9); // Limit to index 9
      counts[bucketIdx] += Number(row.student_count);
    }

    const result = {
      bins: counts.map((_, i) => `B${i}`),
      counts: counts,
    };

    // 5. Cache in Redis
    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.ADMIN_GLOBAL });
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("[Score Histogram Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
