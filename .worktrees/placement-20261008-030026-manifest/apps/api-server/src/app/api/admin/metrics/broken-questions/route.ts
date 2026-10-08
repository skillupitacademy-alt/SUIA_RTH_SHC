import { db } from "@quiz/db";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { requireAdminRouteAccess } from "@/modules/auth/admin-audience.util";

export const dynamic = "force-dynamic";

const ACC_THRESHOLD = parseFloat(process.env.BROKEN_ACC_THRESHOLD ?? "0.30");
const DISCRIM_THRESHOLD = parseFloat(process.env.BROKEN_DISCRIM_THRESHOLD ?? "0.10");
const TIME_MULTIPLIER = parseFloat(process.env.BROKEN_TIME_MULTIPLIER ?? "2.5");
const ATTEMPT_CAP = parseInt(process.env.BROKEN_ATTEMPT_CAP ?? "30", 10);

type BrokenRow = {
  question_id: string;
  stem_preview: string | null;
  difficulty: "easy" | "medium" | "hard";
  attempts: number;
  accuracy: number;
  discrimination: number;
  median_time: number | null;
  p95_time: number | null;
  p05_time: number | null;
  difficulty_median: number | null;
  last_edited_at: string | null;
};

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    await requireAdminRouteAccess(req);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);
    const floor = parseInt(searchParams.get("floor") ?? "10", 10);

    const query = sql`
      WITH difficulty_medians AS (
          SELECT 
              q.difficulty,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY (eq.response_metadata->>'timeTakenSeconds')::int) as difficulty_median
          FROM exam_questions eq
          JOIN questions q ON eq.question_id = q.id
          WHERE eq.response_metadata ? 'timeTakenSeconds'
          AND eq.is_correct IS NOT NULL
          GROUP BY q.difficulty
      ),
      question_stats AS (
          SELECT 
              eq.question_id,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY (eq.response_metadata->>'timeTakenSeconds')::int) as median_time,
              percentile_cont(0.95) WITHIN GROUP (ORDER BY (eq.response_metadata->>'timeTakenSeconds')::int) as p95_time,
              percentile_cont(0.05) WITHIN GROUP (ORDER BY (eq.response_metadata->>'timeTakenSeconds')::int) as p05_time
          FROM exam_questions eq
          WHERE eq.response_metadata ? 'timeTakenSeconds'
          GROUP BY eq.question_id
      )
      SELECT 
          q.id as question_id,
          substring(regexp_replace(q.question_text, '<[^>]*>', '', 'g') from 1 for 80) as stem_preview,
          q.difficulty,
          COALESCE(idif.attempt_count, 0)::int as attempts,
          COALESCE(idif.accuracy_percent / 100.0, 0)::float as accuracy,
          COALESCE((dis.top_accuracy - dis.bottom_accuracy), 0)::float as discrimination,
          qs.median_time::float,
          qs.p95_time::float,
          qs.p05_time::float,
          dm.difficulty_median::float,
          q.updated_at as last_edited_at
      FROM questions q
      LEFT JOIN mv_item_difficulty idif ON q.id = idif.question_id
      LEFT JOIN mv_discrimination dis ON q.id = dis.question_id
      LEFT JOIN question_stats qs ON q.id = qs.question_id
      LEFT JOIN difficulty_medians dm ON q.difficulty = dm.difficulty
      WHERE q.status = 'active'
      AND COALESCE(idif.attempt_count, 0) >= ${floor}
      LIMIT 100
    `;

    const resultList = await db.execute(query);
    const rows = resultList.rows as BrokenRow[];

    const scored = rows.map(row => {
      const accuracy = typeof row.accuracy === "number" ? row.accuracy : 0;
      const discrimination = typeof row.discrimination === "number" ? row.discrimination : 0;
      const hardFlag = accuracy < ACC_THRESHOLD ? 1 : 0;
      const discrimFlag = discrimination < DISCRIM_THRESHOLD ? 1 : 0;
      
      let timeFlag = 0;
      let timeNote = undefined;
      if (typeof row.p95_time === 'number' && typeof row.difficulty_median === 'number' && row.difficulty_median > 0) {
        if (row.p95_time > TIME_MULTIPLIER * row.difficulty_median) {
            timeFlag = 1;
            timeNote = `High Latency: p95 ${row.p95_time.toFixed(1)}s (${(row.p95_time / row.difficulty_median).toFixed(1)}x bucket)`;
        }
      }
      
      if (timeFlag === 0 && typeof row.p05_time === 'number' && row.p05_time < 2 && accuracy < 0.40) {
          timeFlag = 1;
          timeNote = `Potential Guessing: p05 ${row.p05_time.toFixed(1)}s`;
      }

      const score = (0.5 * hardFlag) + (0.3 * discrimFlag) + (0.1 * timeFlag);
      const finalScore = row.attempts < ATTEMPT_CAP ? Math.min(score, 0.6) : score;

      return {
        questionId: row.question_id,
        stemPreview: row.stem_preview ?? "",
        accuracy: accuracy,
        discrimination: discrimination,
        attempts: row.attempts,
        brokenScore: finalScore,
        timeNote,
        difficulty: row.difficulty,
        lastEditedAt: row.last_edited_at,
        flags: { hard: !!hardFlag, discrim: !!discrimFlag, time: !!timeFlag, skip: false }
      };
    });

    const durationMs = Date.now() - start;
    recordCounter('admin.api.metrics.broken_questions.count', 1, { outcome: 'success', limit, floor });
    recordTimer('admin.api.metrics.broken_questions.duration', durationMs, { outcome: 'success' });

    return ApiResponse.success(scored.slice(0, limit), 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (error: unknown) {
    recordCounter('admin.api.metrics.broken_questions.count', 1, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'get_broken_questions_metrics' });
