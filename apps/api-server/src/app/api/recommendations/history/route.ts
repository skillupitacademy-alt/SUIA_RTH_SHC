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

    const { searchParams } = new URL(req.url);
    const topicIdRaw = searchParams.get("topicId");
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw.trim() : "";

    if (topicId.length === 0) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
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

    const formatted = rows.rows.map((r) => ({
      level: r.recommendation_level,
      date: r.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
