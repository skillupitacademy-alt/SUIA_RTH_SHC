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

    // SQL to get latest recommendations per topic and count mistakes from the source exam
    const rows = await db.execute(sql`
      WITH latest_reco AS (
        SELECT DISTINCT ON (topic_id) *
        FROM user_recommendations
        WHERE user_id = ${payload.userId}
        ORDER BY topic_id, created_at DESC
      ),
      weak_subareas AS (
        SELECT 
          exam_id,
          ARRAY_AGG(name) as subareas
        FROM results_by_dimension
        WHERE dimension_type = 'subtopic' AND accuracy < 70
        GROUP BY exam_id
      )
      SELECT 
        lr.topic_id,
        t.name as topic_name,
        t.learning_url,
        lr.recommendation_level,
        lr.metadata->>'accuracy' as accuracy,
        COUNT(eq.id) as total_questions,
        COUNT(CASE WHEN eq.is_correct = false THEN 1 END) as mistake_count,
        ws.subareas
      FROM latest_reco lr
      JOIN topics t ON t.id = lr.topic_id
      LEFT JOIN exam_questions eq ON eq.exam_id = lr.source_exam_id
      LEFT JOIN questions q ON q.id = eq.question_id AND q.topic_id = lr.topic_id
      LEFT JOIN weak_subareas ws ON ws.exam_id = lr.source_exam_id
      GROUP BY lr.topic_id, t.name, t.learning_url, lr.recommendation_level, lr.metadata, lr.created_at, ws.subareas
      ORDER BY lr.created_at DESC
    `);

    const formatted = rows.rows.map((r) => ({
      topicId: r.topic_id,
      topicName: r.topic_name,
      learningUrl: r.learning_url,
      recommendationLevel: r.recommendation_level,
      accuracy: Number(r.accuracy ?? 0),
      totalQuestions: Number(r.total_questions ?? 0),
      mistakeCount: Number(r.mistake_count ?? 0),
      weakSubareas: (r.subareas as string[] | null) || [],
    }));

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
