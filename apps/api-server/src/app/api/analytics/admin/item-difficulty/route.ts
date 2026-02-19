import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

// Standard TTL used via ANALYTICS_CACHE.ADMIN_GLOBAL (3600s)

interface ItemDifficultyRow {
  question_id: string;
  attempt_count: number;
  accuracy_percent: number;
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
    const hasAdminRole = payload.roles.some((role: string) => role === "ADMIN" || role === "SUPER_ADMIN" || role === "admin");
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // 2. Try Redis Cache
    try {
      const cachedData = await redis.get(CACHE_KEYS.ANALYTICS.ADMIN("item-difficulty"));
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. Query Materialized View (Top 20 Hardest Questions, min 5 attempts)
    const rows = (await sql`
      SELECT question_id, attempt_count, accuracy_percent
      FROM mv_item_difficulty
      WHERE attempt_count >= 5
      ORDER BY accuracy_percent ASC
      LIMIT 20
    `) as ItemDifficultyRow[];

    // 4. Transform for ECharts
    const result = {
      ids: rows.map(r => r.question_id),
      accuracy: rows.map(r => Number(r.accuracy_percent)),
      attempts: rows.map(r => Number(r.attempt_count))
    };

    // 5. Cache (Fire-and-forget)
    try {
      if (rows.length > 0) {
        await redis.set(
          CACHE_KEYS.ANALYTICS.ADMIN("item-difficulty"), 
          result, 
          { ex: CACHE_TTL.ADMIN_GLOBAL }
        );
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Admin Item Difficulty Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch item difficulty", message },
      { status: 500 }
    );
  }
}
