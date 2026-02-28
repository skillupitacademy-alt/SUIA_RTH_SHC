import { METRICS } from "@quiz/observability";
import { type NextRequest, NextResponse } from "next/server";

import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { InsightEngineService } from "@/modules/analytics/insight-engine.service";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "score-history");

    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) return NextResponse.json(cachedData);
    } catch (__redisError) {
      // Ignored
    }

    const [rows, userProfile] = await Promise.all([
      sqlReplica`
      SELECT
        DATE(completed_at) AS exam_date,
        total_score
      FROM exams
      WHERE user_id = ${userId}
        AND status = 'completed'
        AND total_score IS NOT NULL
      ORDER BY completed_at ASC
      LIMIT 10
    ` as unknown as Promise<{ exam_date: string; total_score: number }[]>,
      sqlReplica`
      SELECT name FROM user_profiles WHERE user_id = ${userId} LIMIT 1
    ` as unknown as Promise<{ name: string }[]>
    ]);

    const userName = userProfile[0]?.name || "Student";

    const data = {
      dates: rows.map((r) => new Date(r.exam_date).toLocaleDateString()),
      scores: rows.map((r) => Number(r.total_score)),
    };

    const insight = InsightEngineService.analyzePerformanceTrend(userName, data);

    const result = {
      ...data,
      insight,
    };

    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.USER_PERSONAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.SCORE_HISTORY, 1, { outcome: 'success' });
    recordTimer(METRICS.ANALYTICS.SCORE_HISTORY + '.duration', durationMs, { outcome: 'success' });
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.SCORE_HISTORY, 1, { outcome: 'failure' });
    recordTimer(METRICS.ANALYTICS.SCORE_HISTORY + '.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json(
      { error: "Failed to fetch score history", message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_score_history' });
