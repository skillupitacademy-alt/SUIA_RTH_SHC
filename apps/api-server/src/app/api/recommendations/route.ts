import { db } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

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

    const formatted = rows.rows
      .map((r) => ({
        topicName: r.topic_name as string,
        recommendationLevel: r.recommendation_level as string,
        accuracy: Number(r.accuracy ?? 0),
        learningUrl: r.learning_url as string | null,
      }))
      .sort((a, b) => (priority[a.recommendationLevel] ?? 99) - (priority[b.recommendationLevel] ?? 99))
      .slice(0, 5);

    const durationMs = Date.now() - start;
    recordCounter(METRICS.RECOMMENDATIONS.FETCH, 1, { outcome: 'success' });
    recordTimer(METRICS.RECOMMENDATIONS.FETCH + '.duration', durationMs);

    return NextResponse.json(formatted, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordCounter(METRICS.RECOMMENDATIONS.FETCH, 1, { outcome: 'failure' });
    recordTimer(METRICS.RECOMMENDATIONS.FETCH + '.duration', Date.now() - start, { outcome: 'failure' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: "analytics", operation: "get_recommendations" });
