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

interface ScoreDistributionRow {
  score_bucket: number;
  student_count: number;
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

    const payload = await TokenService.verifyAccessToken(token, true);
    
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "ADMIN" || role === "SUPER_ADMIN" || role === "admin"
    );
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.ADMIN("score-histogram");

    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (__redisError) {
      // Ignored
    }

    const rows = (await sqlReplica`
      SELECT score_bucket, student_count
      FROM mv_score_distribution
      ORDER BY score_bucket
    `) as ScoreDistributionRow[];

    const counts = new Array(10).fill(0);
    for (const row of rows) {
      const bucketIdx = Math.min(row.score_bucket, 9);
      counts[bucketIdx] += Number(row.student_count);
    }

    const result = {
      bins: counts.map((_, i) => `B${i}`),
      counts: counts,
    };

    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.ADMIN_GLOBAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.score_histogram', durationMs, { outcome: 'success' });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.score_histogram.count', 1, { outcome: 'success' });
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.score_histogram.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.score_histogram.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_score_histogram' });
