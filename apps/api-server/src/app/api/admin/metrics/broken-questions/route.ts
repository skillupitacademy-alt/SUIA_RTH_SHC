import { db } from "@quiz/db";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TokenService } from "@/modules/auth/token.service";

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

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === null || token === undefined || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, true);
    
    // Explicitly check role
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role.toUpperCase() === "ADMIN" || role.toUpperCase() === "SUPER_ADMIN"
    );
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const floorParam = searchParams.get("floor");
    const limitParsed = limitParam !== null ? parseInt(limitParam, 10) : NaN;
    const floorParsed = floorParam !== null ? parseInt(floorParam, 10) : NaN;
    const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 10;
    const floor = Number.isFinite(floorParsed) && floorParsed > 0 ? floorParsed : 10;

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

    const result = await db.execute(query);
    const rows = result.rows as BrokenRow[];

    // Scoring and filtering in JS
    const scored = rows.map(row => {
      const accuracy = typeof row.accuracy === "number" ? row.accuracy : 0;
      const discrimination = typeof row.discrimination === "number" ? row.discrimination : 0;
      
      const hardFlag = accuracy < ACC_THRESHOLD ? 1 : 0;
      const discrimFlag = discrimination < DISCRIM_THRESHOLD ? 1 : 0;
      
      let timeFlag = 0;
      let timeNote = undefined;
      // Safety checks for time anomaly
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

      // Skip anomaly currently not tracked in schema, so skipFlag = 0
      const skipFlag = 0;

      let score = (0.5 * hardFlag) + (0.3 * discrimFlag) + (0.1 * timeFlag) + (0.1 * skipFlag);
      
      // severity boost floor for low attempts to prevent noise
      if (row.attempts < ATTEMPT_CAP) {
        score = Math.min(score, 0.6);
      }

      return {
        questionId: row.question_id,
        stemPreview: row.stem_preview ?? "",
        accuracy: accuracy,
        discrimination: discrimination,
        attempts: row.attempts,
        brokenScore: score,
        timeNote,
        difficulty: row.difficulty,
        lastEditedAt: row.last_edited_at,
        flags: {
            hard: !!hardFlag,
            discrim: !!discrimFlag,
            time: !!timeFlag,
            skip: !!skipFlag
        }
      };
    });

    // Ranking: highest brokenScore first, tie-break with lowest accuracy
    scored.sort((a, b) => b.brokenScore - a.brokenScore || a.accuracy - b.accuracy);
    
    return NextResponse.json(scored.slice(0, limit));

  } catch (error: unknown) {
    console.error("[Broken Questions API Error]:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : "Unexpected error" 
    }, { status: 500 });
  }
}
