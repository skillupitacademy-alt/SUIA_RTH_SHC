
import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

// Personal cache is shorter and unique per user
const CACHE_TTL = 300; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    // 1. Extract User Identity from Secure Cookie
    const token = TokenService.getAccessToken(req, { scope: "_user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = `analytics:personal:${userId}:score-history`;

    // 2. Try Redis GET
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) return NextResponse.json(cachedData);
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. Query Personal Data (Last 10 Exams)
    // We query the exams table for this specific user
    const rows = (await sql`
      SELECT 
        id,
        total_score,
        completed_at
      FROM exams
      WHERE user_id = ${userId} 
        AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 10
    `) as { total_score: number; completed_at: string }[];

    // 4. Transform for ECharts Line Chart
    // Reversed so chronological order (oldest to newest)
    const sortedRows = rows.reverse();
    
    const result = {
      dates: sortedRows.map((r) => new Date(r.completed_at).toLocaleDateString()),
      scores: sortedRows.map((r) => Number(r.total_score)),
    };

    // 5. Cache result
    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL });
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("[Personal Analytics Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal analytics", message },
      { status: 500 }
    );
  }
}
