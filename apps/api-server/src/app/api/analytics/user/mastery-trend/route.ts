import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { InsightEngineService } from "@/modules/analytics/insight-engine.service";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

interface UserMasteryTrendRow {
  exam_date: string;
  avg_accuracy: number;
}

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Authentication required");
    }

    const payload = await container.get(TokenService).verifyAccessToken(token, false);
    if (payload === null || payload === undefined) {
      throw unauthorized("Authentication required");
    }
    const userId = payload.userId;
    if (userId === null || userId === undefined) {
      throw unauthorized("User id missing from token");
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "mastery-trend");

    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) return ApiResponse.success(cachedData);
    } catch (__redisError) {
      // Ignored
    }

    const [rows, userProfile, scoreRows] = await Promise.all([
      sqlReplica`
      SELECT 
        DATE(created_at) AS exam_date,
        AVG(accuracy) AS avg_accuracy
      FROM results_by_dimension
      WHERE exam_id IN (SELECT id FROM exams WHERE user_id = ${userId})
      GROUP BY DATE(created_at)
      ORDER BY exam_date ASC
    ` as unknown as Promise<UserMasteryTrendRow[]>,
      sqlReplica`
      SELECT name FROM user_profiles WHERE user_id = ${userId} LIMIT 1
    ` as unknown as Promise<{ name: string }[]>,
      sqlReplica`
      SELECT total_score FROM exams WHERE user_id = ${userId} AND status = 'completed' ORDER BY completed_at ASC LIMIT 10
    ` as unknown as Promise<{ total_score: number }[]>
    ]);

    const userName = userProfile[0]?.name || "Student";

    const data = {
      dates: rows.map((r) => new Date(r.exam_date).toLocaleDateString()),
      accuracy: rows.map((r) => Math.round(Number(r.avg_accuracy))),
    };

    const insight = InsightEngineService.analyzeMasteryTrend(
      userName,
      data,
      { scores: scoreRows.map(s => Number(s.total_score)) }
    );

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
    recordCounter(METRICS.ANALYTICS.MASTERY_TREND, 1, { outcome: 'success' });
    recordTimer(METRICS.ANALYTICS.MASTERY_TREND + '.duration', durationMs, { outcome: 'success' });
    return ApiResponse.success(result, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.MASTERY_TREND, 1, { outcome: 'failure' });
    recordTimer(METRICS.ANALYTICS.MASTERY_TREND + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'analytics', operation: 'get_mastery_trend' });
