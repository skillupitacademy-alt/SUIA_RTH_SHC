import { type NextRequest } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface DifficultyRow {
  difficulty: string;
  accuracy: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Identity Verification
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "difficulty-accuracy");

    // 2. Redis Cache
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return Response.json(cachedData);
      }
    } catch (_redisError) {
      // Ignore cache errors and fall back to DB
    }

    // 3. SQL Query: Latest accuracy per difficulty
    const rows = (await sql`
      SELECT DISTINCT ON (r.name)
        r.name AS difficulty,
        r.accuracy
      FROM results_by_dimension r
      JOIN exams e ON e.id = r.exam_id
      WHERE e.user_id = ${userId}
        AND r.dimension_type = 'difficulty'
      ORDER BY r.name, r.created_at DESC;
    `) as DifficultyRow[];

    // 4. Transform for ECharts with Fixed Order
    const labels = ["simple", "intermediate", "expert"];
    const accuracy = labels.map((label) => {
      const match = rows.find((r) => r.difficulty.toLowerCase() === label);
      return match ? Number(match.accuracy) : 0;
    });

    const result = { labels, accuracy };

    // 5. Cache result
    try {
      await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.USER_PERSONAL });
    } catch (_redisError) {
      // Ignore cache set failures
    }

    return Response.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json(
      { error: "Failed to fetch difficulty accuracy", message },
      { status: 500 }
    );
  }
}
