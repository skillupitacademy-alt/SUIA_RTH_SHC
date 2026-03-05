import { db } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { sql } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

interface RecommendationRow {
  topic_id: string;
  recommendation_level: string;
  accuracy: string | null;
  topic_name: string;
  learning_url: string | null;
}

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized");
    }
    const payload = await container.get(TokenService).verifyAccessToken(token, false);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required");
    }

    const rows = await db.execute(sql`
      SELECT DISTINCT ON (ur.topic_id)
        ur.topic_id,
        ur.recommendation_level,
        ur.metadata->>'accuracy' AS accuracy,
        t.name AS topic_name,
        t.learning_url
      FROM user_recommendations ur
      JOIN topics t ON t.id = ur.topic_id
      WHERE ur.user_id = ${payload.userId}
      ORDER BY ur.topic_id, ur.created_at DESC
    `);

    const priority: Record<string, number> = { revise: 1, practice: 2, advance: 3 };

    const formatted = (rows.rows as unknown as RecommendationRow[])
      .map((r) => ({
        topicName: r.topic_name,
        recommendationLevel: r.recommendation_level,
        accuracy: Number(r.accuracy ?? 0),
        learningUrl: r.learning_url,
      }))
      .sort((a, b) => (priority[a.recommendationLevel] ?? 99) - (priority[b.recommendationLevel] ?? 99))
      .slice(0, 5);

    const durationMs = Date.now() - start;
    recordCounter(METRICS.RECOMMENDATIONS.FETCH, 1, { outcome: 'success' });
    recordTimer(METRICS.RECOMMENDATIONS.FETCH + '.duration', durationMs);

    return ApiResponse.success(formatted, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    recordCounter(METRICS.RECOMMENDATIONS.FETCH, 1, { outcome: 'failure' });
    recordTimer(METRICS.RECOMMENDATIONS.FETCH + '.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: "analytics", operation: "get_recommendations" });
