import { METRICS } from "@quiz/observability";
import { type NextRequest, NextResponse } from "next/server";

import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";
import { ResilienceService } from "@/modules/core/resilience.service";

export const dynamic = "force-dynamic";

interface MasteryTrendRow {
  exam_date: Date;
  avg_accuracy: number;
}

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    if (!(await ResilienceService.isFeatureEnabled('analytics'))) {
      return NextResponse.json(ResilienceService.getBusyPayload('analytics'), { status: 503 });
    }

    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await TokenService.verifyAccessToken(token, true);

    try {
      const cachedData = await redis.get(CACHE_KEYS.ANALYTICS.ADMIN("mastery-trend"));
      if (cachedData !== null) return NextResponse.json(cachedData);
    } catch (__redisError) {
      // Ignored
    }

    const rows = (await sqlReplica`
      SELECT exam_date, avg_accuracy
      FROM mv_mastery_trend
      ORDER BY exam_date ASC
    `) as MasteryTrendRow[];

    const result = {
      dates: rows.map((r) => new Date(r.exam_date).toLocaleDateString()),
      accuracy: rows.map((r) => Math.round(Number(r.avg_accuracy))),
    };

    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEYS.ANALYTICS.ADMIN("mastery-trend"), result, { ex: CACHE_TTL.ADMIN_GLOBAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.mastery_trend', durationMs, { outcome: 'success' });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.mastery_trend.count', 1, { outcome: 'success' });
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.mastery_trend.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.mastery_trend.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ error: "Failed to fetch admin mastery trend", message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_admin_mastery_trend' });
