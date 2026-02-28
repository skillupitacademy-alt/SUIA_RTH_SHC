import { METRICS } from "@quiz/observability";
import { type NextRequest, NextResponse } from "next/server";

import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface TopicRow {
  topic: string;
  accuracy: number;
}

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "topic-performance");
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
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
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.TOPIC_PERF, 1, { outcome: 'failure' });
    recordTimer(METRICS.ANALYTICS.TOPIC_PERF + '.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json(
      { error: "Failed to fetch topic performance", message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_topic_performance' });
