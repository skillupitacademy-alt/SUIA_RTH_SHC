import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";

export const dynamic = "force-dynamic";

// Standard TTL used via ANALYTICS_CACHE.ADMIN_GLOBAL

interface ScoreDistributionRow {
  score_bucket: number;
  student_count: number;
}

export async function GET() {
  try {
    // 1. Try Redis GET
    try {
      const cachedData = await redis.get(CACHE_KEYS.ANALYTICS.ADMIN("score-histogram"));
      if (cachedData !== null) {
        return Response.json(cachedData);
      }
    } catch (redisError) {
      // Log error but fallback to DB
      console.error("[Redis Error]:", redisError);
    }

    // 2. Query Materialized View
    const rows = (await sql`
      SELECT score_bucket, student_count
      FROM mv_score_distribution
      ORDER BY score_bucket
    `) as ScoreDistributionRow[];

    // 3. Transform for ECharts
    // Expected format: { bins: ["B1", ...], counts: [10, ...] }
    const result = {
      bins: rows.map((r) => `B${r.score_bucket}`),
      counts: rows.map((r) => Number(r.student_count)),
    };

    // 4. Cache in Redis (Fire and forget, don't block response)
    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEYS.ANALYTICS.ADMIN("score-histogram"), result, { ex: CACHE_TTL.ADMIN_GLOBAL });
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return Response.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
