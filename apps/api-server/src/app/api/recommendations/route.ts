import { db } from "@quiz/db";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
