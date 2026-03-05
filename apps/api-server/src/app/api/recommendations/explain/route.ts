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

interface RecommendationExplainRow {
  topic_id: string;
  topic_name: string;
  learning_url: string | null;
  recommendation_level: string;
  accuracy: string | null;
  total_questions: string | number | null;
  mistake_count: string | number | null;
  subareas: string[] | null;
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

    const formatted = (rows.rows as unknown as RecommendationExplainRow[]).map((r) => ({
      topicId: r.topic_id,
      topicName: r.topic_name,
      learningUrl: r.learning_url,
      recommendationLevel: r.recommendation_level,
      accuracy: Number(r.accuracy ?? 0),
      totalQuestions: Number(r.total_questions ?? 0),
      mistakeCount: Number(r.mistake_count ?? 0),
      weakSubareas: r.subareas ?? [],
    }));

    recordCounter(METRICS.RECOMMENDATIONS.FETCH, 1, { view: 'explain', outcome: 'success' });
    recordTimer(METRICS.RECOMMENDATIONS.FETCH + '.duration', Date.now() - start, { view: 'explain', outcome: 'success' });

    return ApiResponse.success(formatted);
  } catch (error: unknown) {
    recordCounter(METRICS.RECOMMENDATIONS.FETCH, 1, { view: 'explain', outcome: 'failure' });
    recordTimer(METRICS.RECOMMENDATIONS.FETCH + '.duration', Date.now() - start, { view: 'explain', outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'recommendations', operation: 'get_explanation' });
