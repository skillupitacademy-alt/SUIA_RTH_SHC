
import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const CACHE_KEY = "analytics:admin:mastery-trend";
const CACHE_TTL = 3600; // 1 hour for admin trends

interface MasteryTrendRow {
  exam_date: Date;
  avg_accuracy: number;
}

export async function GET() {
  try {
    // 1. Try Redis GET
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) return Response.json(cachedData);
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 2. Query Materialized View (Admin)
    const rows = (await sql`
      SELECT exam_date, avg_accuracy
      FROM mv_mastery_trend
      ORDER BY exam_date ASC
    `) as MasteryTrendRow[];

    // 3. Transform for ECharts
    const result = {
      dates: rows.map((r) => new Date(r.exam_date).toLocaleDateString()),
      accuracy: rows.map((r) => Math.round(Number(r.avg_accuracy))),
    };

    // 4. Cache
    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL });
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return Response.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: "Failed to fetch admin mastery trend", message }, { status: 500 });
  }
}
