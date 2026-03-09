import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

interface TopicRow {
  topic: string;
  accuracy: number;
}

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Authentication required");
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (payload === null || payload === undefined) {
      throw unauthorized("Authentication required");
    }
    const userId = payload.userId;
    if (userId === null || userId === undefined) {
      throw unauthorized("User id missing from token");
    }

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "topic-performance");
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return ApiResponse.success(cachedData);
      }
    } catch (__redisError) {
      // Ignored for fallback to DB
    }

    const rows = (await sqlReplica`
      SELECT DISTINCT ON (r.name)
        r.name AS topic,
        r.accuracy
      FROM results_by_dimension r
      JOIN exams e ON e.id = r.exam_id
      WHERE e.user_id = ${userId}
        AND r.dimension_type = 'topic'
      ORDER BY r.name, r.created_at DESC
    `) as TopicRow[];

    const result = {
      topics: rows.map(r => r.topic ?? "Unknown"),
      accuracy: rows.map(r => Number(r.accuracy)),
    };

    try {
      if (rows.length > 0) {
        await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.USER_PERSONAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.TOPIC_PERF, 1, { outcome: 'success' });
    recordTimer(METRICS.ANALYTICS.TOPIC_PERF + '.duration', durationMs, { outcome: 'success' });
    return ApiResponse.success(result, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.TOPIC_PERF, 1, { outcome: 'failure' });
    recordTimer(METRICS.ANALYTICS.TOPIC_PERF + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'analytics', operation: 'get_topic_performance' });
