import { db } from "@quiz/db";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await TokenService.verifyAccessToken(token, true);

    // 1. Notes Demand (Top 10 topics)
    const notesDemand = await db.execute(sql`
      SELECT t.name, COUNT(nal.id)::int as count
      FROM notes_access_logs nal
      JOIN topics t ON t.id = nal.topic_id
      GROUP BY t.name
      ORDER BY count DESC
      LIMIT 10
    `);

    // 2. Email Health
    const emailHealth = await db.execute(sql`
      SELECT status, COUNT(*)::int as count
      FROM background_jobs
      WHERE type = 'SEND_NOTES_EMAIL'
      GROUP BY status
    `);

    // 3. Weak Topics (Students needing most help)
    const weakTopics = await db.execute(sql`
      SELECT t.name, COUNT(ur.id)::int as student_count
      FROM user_recommendations ur
      JOIN topics t ON t.id = ur.topic_id
      WHERE ur.recommendation_level = 'revise'
      GROUP BY t.name
      ORDER BY student_count DESC
      LIMIT 10
    `);

    // 4. Help Requests Status
    const helpRequests = await db.execute(sql`
      SELECT status, COUNT(*)::int as count
      FROM tutor_help_requests
      GROUP BY status
    `);

    return NextResponse.json({
      notesDemand: notesDemand.rows,
      emailHealth: emailHealth.rows,
      weakTopics: weakTopics.rows,
      helpRequests: helpRequests.rows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
