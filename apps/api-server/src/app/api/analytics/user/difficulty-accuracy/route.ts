import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface DifficultyRow {
  difficulty: string;
  accuracy: number;
}

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "difficulty-accuracy");

    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return Response.json(cachedData);
      }
    } catch (__redisError) {
      // Ignored
    }

    const rows = (await sqlReplica`
      SELECT DISTINCT ON (r.name)
        r.name AS difficulty,
        r.accuracy
      FROM results_by_dimension r
      JOIN exams e ON e.id = r.exam_id
      WHERE e.user_id = ${userId}
        AND r.dimension_type = 'difficulty'
      ORDER BY r.name, r.created_at DESC;
    `) as DifficultyRow[];

    const labels = ["simple", "intermediate", "expert"];
    const accuracy = labels.map((label) => {
      const match = rows.find((r) => r.difficulty.toLowerCase() === label);
      return match ? Number(match.accuracy) : 0;
    });

    const result = { labels, accuracy };

    try {
      await redis.set(CACHE_KEY, result, { ex: CACHE_TTL.USER_PERSONAL });
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.DIFFICULTY_ACCURACY, 1, { outcome: 'success' });
    recordTimer(METRICS.ANALYTICS.DIFFICULTY_ACCURACY + '.duration', durationMs, { outcome: 'success' });
    return Response.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.DIFFICULTY_ACCURACY, 1, { outcome: 'failure' });
    recordTimer(METRICS.ANALYTICS.DIFFICULTY_ACCURACY + '.duration', durationMs, { outcome: 'failure' });
    return Response.json(
      { error: "Failed to fetch difficulty accuracy", message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_difficulty_accuracy' });
