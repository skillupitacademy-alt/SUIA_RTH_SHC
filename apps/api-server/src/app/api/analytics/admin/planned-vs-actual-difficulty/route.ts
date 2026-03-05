import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { forbidden, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';
import { ResilienceService } from "@/modules/core/resilience.service";

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

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    if (!(await ResilienceService.isFeatureEnabled('analytics'))) {
      return ApiResponse.error(new Error("Analytics service is busy"), 503);
    }

    const token = container.get(TokenService).getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
      throw unauthorized("Authentication required");
    }

    const payload = await container.get(TokenService).verifyAccessToken(token, true);
    const isAdmin = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "ADMIN" || role === "SUPER_ADMIN"
    );

    if (!isAdmin && payload.isAdmin !== true) {
      throw forbidden("Forbidden: Admin access only");
    }

    const CACHE_KEY = "analytics:admin:planned-vs-actual-difficulty";

    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached !== null) return ApiResponse.success(cached);
    } catch (_err) {
      // Ignored
    }

    const [blueprint] = (await sqlReplica`
      SELECT difficulty_distribution
      FROM exam_blueprints
      ORDER BY created_at DESC
      LIMIT 1;
    `) as [{ difficulty_distribution: BlueprintDistribution } | undefined];

    const actualRows = (await sqlReplica`
      WITH totals AS (
        SELECT SUM(question_count) as grand_total FROM mv_exam_difficulty_actual
      )
      SELECT 
        difficulty,
        ROUND((SUM(question_count) * 100.0) / NULLIF((SELECT grand_total FROM totals), 0), 1) as actual_percent
      FROM mv_exam_difficulty_actual
      GROUP BY difficulty;
    `) as ActualRow[];

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

    try {
      await redis.set(CACHE_KEY, result, { ex: 1800 });
    } catch (_err) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.planned_vs_actual', durationMs, { outcome: 'success' });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.planned_vs_actual.count', 1, { outcome: 'success' });
    return ApiResponse.success(result, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.planned_vs_actual.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.planned_vs_actual.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'analytics', operation: 'get_planned_vs_actual_difficulty' });
