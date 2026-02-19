import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface TopicRow {
  topic: string;
  accuracy: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Auth — extract userId from token (never from params)
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    // 2. Redis Cache
    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "topic-performance");
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. Query — latest accuracy per topic for this user
    const rows = (await sql`
      SELECT DISTINCT ON (r.name)
        r.name AS topic,
        r.accuracy
      FROM results_by_dimension r
      JOIN exams e ON e.id = r.exam_id
      WHERE e.user_id = ${userId}
        AND r.dimension_type = 'topic'
      ORDER BY r.name, r.created_at DESC
    `) as TopicRow[];

    // 4. Transform for frontend
    const result = {
      topics: rows.map(r => r.topic ?? "Unknown"),
      accuracy: rows.map(r => Number(r.accuracy)),
    };

    // 5. Cache (TTL: 120s / USER_PERSONAL)
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
    console.error("[User Topic Performance Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic performance", message },
      { status: 500 }
    );
  }
}
