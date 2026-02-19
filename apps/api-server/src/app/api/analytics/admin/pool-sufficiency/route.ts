import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface PoolTotalRow {
  total_available: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. RBAC (Admin/SuperAdmin)
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, true);
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
        (role: string) => role === "ADMIN" || role === "SUPER_ADMIN"
    );

    if (!hasAdminRole && payload.isAdmin !== true) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.ADMIN("pool-sufficiency");

    // 2. Redis Cache-Aside
    try {
        const cachedData = await redis.get(CACHE_KEY);
        if (cachedData !== null) {
            return NextResponse.json(cachedData);
        }
    } catch (redisError) {
        console.error("[Redis Error]:", redisError);
    }

    // 3. Query Materialized View for Global Totals
    const [stats] = (await sql`
      SELECT COALESCE(SUM(available_questions), 0) AS total_available
      FROM mv_question_pool;
    `) as [PoolTotalRow | undefined];

    const available = stats ? Number(stats.total_available) : 0;
    const required = 500; // Baseline requirement
    const percent = Math.min(100, Math.floor((available / required) * 100));

    const result = {
        available,
        required,
        percent
    };

    // 4. Redis Cache Set (30 Min TTL)
    try {
        // Cache even if zero, 1800s as requested
        await redis.set(CACHE_KEY, result, { ex: 1800 });
    } catch (redisError) {
        console.error("[Redis Cache Error]:", redisError);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("[Pool Sufficiency API Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
