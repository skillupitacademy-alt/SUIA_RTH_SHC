import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface BlueprintDistribution {
  simple: number;
  intermediate: number;
  expert: number;
}

interface ActualRow {
  difficulty: string;
  actual_percent: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. RBAC Check
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, true);
    const isAdmin = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "ADMIN" || role === "SUPER_ADMIN"
    );

    if (!isAdmin && payload.isAdmin !== true) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const CACHE_KEY = "analytics:admin:planned-vs-actual-difficulty";

    // 2. Redis Cache
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached !== null) return NextResponse.json(cached);
    } catch (err) {
      console.error("[Redis Error]:", err);
    }

    // 3. Data Extraction
    // Get Latest Blueprint
    const [blueprint] = (await sql`
      SELECT difficulty_distribution
      FROM exam_blueprints
      ORDER BY created_at DESC
      LIMIT 1;
    `) as [{ difficulty_distribution: BlueprintDistribution } | undefined];

    // Get Actual Stats from Materialized View
    // Note: Migration 0006 uses question_count, so we calculate percent here to be safe
    // but the prompt asked for actual_percent, so we handle both or just follow the prompt's intent.
    const actualRows = (await sql`
      WITH totals AS (
        SELECT SUM(question_count) as grand_total FROM mv_exam_difficulty_actual
      )
      SELECT 
        difficulty,
        ROUND((SUM(question_count) * 100.0) / NULLIF((SELECT grand_total FROM totals), 0), 1) as actual_percent
      FROM mv_exam_difficulty_actual
      GROUP BY difficulty;
    `) as ActualRow[];

    // 4. Transformation
    const labels = ["simple", "intermediate", "expert"];
    const plannedMap: BlueprintDistribution | null = blueprint?.difficulty_distribution ?? null;

    const planned = labels.map((l) =>
      Number(plannedMap?.[l as keyof BlueprintDistribution] ?? 0)
    );
    const actual = labels.map(l => {
      const row = actualRows.find(r => r.difficulty.toLowerCase() === l);
      return row ? Number(row.actual_percent) : 0;
    });

    const result = { labels, planned, actual };

    // 5. Caching (30 min)
    try {
      await redis.set(CACHE_KEY, result, { ex: 1800 });
    } catch (err) {
      console.error("[Redis Cache Set Error]:", err);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Difficulty Variance API Error]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
