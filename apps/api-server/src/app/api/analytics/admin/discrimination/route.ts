import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface DiscriminationRow {
  question_id: string;
  top_accuracy: number;
  bottom_accuracy: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Identity & Role Verification (RBAC)
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, true);
    
    // Explicitly check role
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "ADMIN" || role === "SUPER_ADMIN" || role === "admin"
    );
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.ADMIN("discrimination");

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
      SELECT question_id, top_accuracy, bottom_accuracy
      FROM mv_discrimination
      ORDER BY (top_accuracy - bottom_accuracy) DESC
    `) as DiscriminationRow[];

    // 4. Transform for ECharts
    const result = {
      points: rows.map(r => ({
        id: r.question_id,
        top: Number(r.top_accuracy),
        bottom: Number(r.bottom_accuracy)
      }))
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
    console.error("[Discrimination API Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
