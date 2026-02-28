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
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await TokenService.verifyAccessToken(token, true);

    const [notesDemand, emailHealth, weakTopics, helpRequests] = await Promise.all([
      db.execute(sql`
        SELECT t.name, COUNT(nal.id)::int as count
        FROM notes_access_logs nal
        JOIN topics t ON t.id = nal.topic_id
        GROUP BY t.name
        ORDER BY count DESC
        LIMIT 10
      `),
      db.execute(sql`
        SELECT status, COUNT(*)::int as count
        FROM background_jobs
        WHERE type = 'SEND_NOTES_EMAIL'
        GROUP BY status
      `),
      db.execute(sql`
        SELECT t.name, COUNT(ur.id)::int as student_count
        FROM user_recommendations ur
        JOIN topics t ON t.id = ur.topic_id
        WHERE ur.recommendation_level = 'revise'
        GROUP BY t.name
        ORDER BY student_count DESC
        LIMIT 10
      `),
      db.execute(sql`
        SELECT status, COUNT(*)::int as count
        FROM tutor_help_requests
        GROUP BY status
      `)
    ]);

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor', 1, { outcome: 'success' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.duration', durationMs, { outcome: 'success' });
    return NextResponse.json({
      notesDemand: notesDemand.rows,
      emailHealth: emailHealth.rows,
      weakTopics: weakTopics.rows,
      helpRequests: helpRequests.rows,
    }, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_tutor_metrics' });
