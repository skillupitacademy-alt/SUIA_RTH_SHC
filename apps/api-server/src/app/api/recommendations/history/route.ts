import { db } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { sql } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface RecommendationHistoryRow {
  recommendation_level: string;
  created_at: string;
}

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized");
    }
    const payload = await TokenService.verifyAccessToken(token, false);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const topicIdRaw = searchParams.get("topicId");
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw.trim() : "";

    if (topicId.length === 0) {
      throw badRequest("topicId is required");
    }

    // SQL to get history of recommendations for a specific topic
    const rows = await db.execute(sql`
      SELECT 
        recommendation_level,
        created_at
      FROM user_recommendations
      WHERE user_id = ${payload.userId} AND topic_id = ${topicId}
      ORDER BY created_at ASC
    `);

    const formatted = (rows.rows as unknown as RecommendationHistoryRow[]).map((r) => ({
      level: r.recommendation_level,
      date: r.created_at,
    }));

    recordCounter(METRICS.RECOMMENDATIONS.FETCH, 1, { view: 'history', outcome: 'success' });
    recordTimer(METRICS.RECOMMENDATIONS.FETCH + '.duration', Date.now() - start, { view: 'history', outcome: 'success' });

    return ApiResponse.success(formatted);
  } catch (error: unknown) {
    recordCounter(METRICS.RECOMMENDATIONS.FETCH, 1, { view: 'history', outcome: 'failure' });
    recordTimer(METRICS.RECOMMENDATIONS.FETCH + '.duration', Date.now() - start, { view: 'history', outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'recommendations', operation: 'get_topic_history' });
