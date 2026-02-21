import { db, exams, resultsByDimension } from "@quiz/db";
import { and, desc, eq, sql } from "drizzle-orm";

import { logger } from "@/lib/logger";

import { AdaptiveTutorService } from "../adaptive-engine/adaptive-tutor.service";

export interface ActionPlanItem {
  id: string;
  priority: 'critical' | 'growth' | 'stable';
  label: string;
  recommendation: string;
  skills: string[];
  accuracy: number;
}

interface DimensionResult {
  dimensionType: string;
  dimensionId: string | null;
  name: string | null;
  score: number;
  accuracy: number;
  skills?: string[];
  id?: string;
}

class ActionPlanBuilder {
  static build(results: DimensionResult[]): ActionPlanItem[] {
    const skillResults = results.filter(r => r.dimensionType === 'skill');

    return skillResults
      .map((r: DimensionResult) => {
        let priority: ActionPlanItem['priority'] = 'stable';
        let label = 'Verified Mastery';
        let recommendation = 'Proficiency achieved. Continue periodic maintenance.';

        if (r.accuracy < 50) {
          priority = 'critical';
          label = 'Immediate Review';
          recommendation = 'Foundational gaps detected. Priority re-study required.';
        } else if (r.accuracy < 75) {
          priority = 'growth';
          label = 'Reinforced Practice';
          recommendation = 'High-growth potential. Focus on complex edge cases.';
        }

        return {
          id: (r.dimensionId !== null && r.dimensionId !== '') ? r.dimensionId : (r.name !== null && r.name !== '') ? r.name : 'unknown',
          priority,
          label,
          recommendation: recommendation,
          skills: [(r.name !== null && r.name !== '') ? r.name : 'Unknown'],
          accuracy: r.accuracy
        };
      })
      .sort((a, b) => {
        const priorityOrder = { critical: 0, growth: 1, stable: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority] || a.accuracy - b.accuracy;
      })
      .slice(0, 3);
  }
}

export class ReportEngine {
  private static log = logger.child({ module: 'report-engine' });

  static async getUserPerformance(userId: string) {
    const userExams = await db.query.exams.findMany({
      where: eq(exams.userId, userId),
      orderBy: [desc(exams.completedAt)],
      with: {
        dimensions: true,
      }
    });

    return {
      examsCompleted: userExams.length,
      averageScore: userExams.length > 0 ? userExams.reduce((acc, curr) => acc + (curr.totalScore !== null ? curr.totalScore : 0), 0) / userExams.length : 0,
      dimensions: userExams.flatMap(e => e.dimensions),
    };
  }

  private static async calculatePercentile(currentExamId: string, blueprintId: string | null, myAccuracy: number): Promise<number> {
    try {
        let whereClause = eq(exams.status, 'completed');
        if (blueprintId !== null && blueprintId !== undefined) {
            whereClause = and(eq(exams.status, 'completed'), eq(exams.blueprintId, blueprintId))!;
        }

        const cohort = await db.query.exams.findMany({
            where: whereClause,
            columns: { id: true, totalScore: true },
            with: {
                examQuestions: {
                    columns: { isCorrect: true }
                }
            }
        });

        // Use 50 as a neutral default for single user. Avoid 99 as it's misleading.
        if (cohort.length <= 1) return 50;

        // Map cohort to accuracy percentages to avoid point-based bias (raw score vs correctness ratio)
        const accuracies = cohort.map(e => {
            const total = e.examQuestions?.length ?? 0;
            const correct = e.examQuestions?.filter(q => q.isCorrect === true).length ?? 0;
            return total > 0 ? (correct / total) * 100 : 0;
        });

        const lowerScores = accuracies.filter(acc => acc < myAccuracy).length;
        // Formula: (Number of scores below / total number of scores) * 100
        const percentile = (lowerScores / cohort.length) * 100;

        // Clamp to 1-99 range for premium aesthetic and avoid 0 or 100 which are statistically unlikely
        return Math.min(99, Math.max(1, Math.round(percentile)));
    } catch (e) {
        ReportEngine.log.error({ currentExamId, error: e instanceof Error ? e.message : 'unknown' }, 'Percentile failed');
        return 50;
    }
  }

  static async getExamReport(examId: string, options: { includeCorrectAnswers?: boolean } = {}) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          with: {
            question: true,
          }
        },
        blueprint: true,
      }
    });

    if (exam === undefined || exam === null) throw new Error('Exam not found');

    const results = await db.query.resultsByDimension.findMany({
      where: eq(resultsByDimension.examId, examId),
    });

    const totalQuestions = exam.examQuestions.length;
    const correctAnswers = exam.examQuestions.filter(eq => eq.isCorrect === true).length;
    const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    let timeTaken = "00m 00s";
    if ((exam.completedAt !== null && exam.completedAt !== undefined) && (exam.startedAt !== null && exam.startedAt !== undefined)) {
        const diffMs = exam.completedAt.getTime() - exam.startedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        timeTaken = `${diffMins}m ${diffSecs}s`;
    }

    const percentile = await ReportEngine.calculatePercentile(exam.id, exam.blueprintId, scorePercentage);
    const includeCorrect = options.includeCorrectAnswers === true;
    const actionPlan = ActionPlanBuilder.build(results);

    const topicResults = results.filter(r => r.dimensionType === 'topic');
    const topicAccuracyRecords = topicResults.map(r => ({
      topicId: r.dimensionId!,
      accuracy: r.accuracy
    }));
    
    // Short circuit insights if no topic data
    const tutorInsights = topicAccuracyRecords.length > 0 
      ? await AdaptiveTutorService.generateInsights(exam.userId, topicAccuracyRecords)
      : "Baseline performance data established. Proceed to further modules to generate deeper tactical insights.";

    return {
      id: exam.id,
      userId: exam.userId,
      status: exam.status,
      score: correctAnswers,
      total: totalQuestions,
      percentage: Math.round(scorePercentage),
      statusLabel: scorePercentage >= 70 ? 'passed' : 'failed',
      completedAt: exam.completedAt,
      timeTaken,
      percentile,
      blueprint: exam.blueprint,
      actionPlan,
      tutorInsights,
      performance: (results as unknown as DimensionResult[]).reduce((acc: Record<string, DimensionResult[]>, r: DimensionResult) => {
        if (acc[r.dimensionType] === undefined) acc[r.dimensionType] = [];
        acc[r.dimensionType].push({
          dimensionId: r.dimensionId,
          name: r.name,
          score: r.score,
          accuracy: r.accuracy
        } as DimensionResult);
        return acc;
      }, {} as Record<string, DimensionResult[]>),
      questions: exam.examQuestions.map(eq => ({
        text: eq.question.questionText,
        userAnswer: eq.userAnswer,
        correctAnswer: includeCorrect ? eq.question.correctAnswer : undefined,
        explanation: includeCorrect ? eq.question.explanation : undefined,
        isCorrect: eq.isCorrect,
        timeSpent: (eq.responseMetadata as Record<string, unknown>)?.timeSpentSeconds as number || 0,
      }))
    };
  }

  static async getPremiumExamReport(examId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        blueprint: true,
      }
    });

    if (exam === undefined || exam === null) throw new Error('Exam not found');

    // Phase 0: Scientific Validation Single-Query Engine
    const coreMetricsRaw = await db.execute(sql`
      WITH base_questions AS (
        SELECT
          eq.id,
          eq.exam_id,
          q.subtopic_id,
          q.difficulty,
          eq.is_correct::int AS is_correct,
          (eq.response_metadata->>'timeSpentSeconds')::int AS time_spent,
          s.name as subtopic_name,
          sk.name as skill_name
        FROM exam_questions eq
        JOIN questions q ON q.id = eq.question_id
        LEFT JOIN subtopics s ON s.id = q.subtopic_id
        LEFT JOIN question_skills qs ON qs.question_id = q.id
        LEFT JOIN skills sk ON sk.id = qs.skill_id
        WHERE eq.exam_id = ${examId}
      ),
      score_cte AS (
        SELECT AVG(is_correct) * 100 AS score,
               COUNT(*) AS question_count,
               SUM(time_spent) as total_time
        FROM base_questions
      ),
      mastery_cte AS (
        SELECT
          SUM(is_correct * weight)::numeric / NULLIF(SUM(weight), 0) * 100 AS mastery
        FROM (
          SELECT
            is_correct,
            CASE difficulty
              WHEN 'simple' THEN 1
              WHEN 'intermediate' THEN 2
              WHEN 'expert' THEN 3
            END AS weight
          FROM base_questions
        ) w
      ),
      mh_cte AS (
        SELECT AVG(is_correct) * 100 AS mh_accuracy
        FROM base_questions
        WHERE difficulty IN ('intermediate','expert')
      ),
      readiness_cte AS (
        SELECT ROUND(
          0.5 * COALESCE(s.score, 0) +
          0.3 * COALESCE(mh.mh_accuracy, 0) +
          0.2 * 100
        , 2) AS readiness
        FROM score_cte s, mh_cte mh
      ),
      variance_cte AS (
        SELECT VAR_SAMP(acc) AS variance
        FROM (
          SELECT subtopic_id, AVG(is_correct) AS acc
          FROM base_questions
          GROUP BY subtopic_id
        ) v
      ),
      confidence_cte AS (
        SELECT
          CASE
            WHEN s.question_count < 10 THEN 'LOW'
            WHEN COALESCE(v.variance, 0) > 0.05 THEN 'MEDIUM'
            WHEN NOT EXISTS (SELECT 1 FROM base_questions WHERE difficulty IN ('intermediate', 'expert')) THEN 'LOW'
            ELSE 'HIGH'
          END AS confidence,
          COALESCE(v.variance, 0) > 0.15 AS is_inconsistent
        FROM score_cte s, variance_cte v
      ),
      root_cause_cte AS (
        -- 🥇 Primary: real weakest bucket (minimum 2 questions)
        SELECT subtopic, skill, difficulty
        FROM (
          SELECT
            subtopic_name as subtopic,
            skill_name as skill,
            difficulty,
            AVG(is_correct) AS acc,
            COUNT(*) AS qcount
          FROM base_questions
          GROUP BY subtopic_name, skill_name, difficulty
          HAVING COUNT(*) >= 2
          ORDER BY acc ASC, qcount DESC
          LIMIT 1
        ) primary_rc

        UNION ALL

        -- 🥈 Fallback: weakest subtopic overall (if no bucket >= 2)
        SELECT subtopic, NULL AS skill, NULL AS difficulty
        FROM (
          SELECT
            subtopic_name as subtopic,
            AVG(is_correct) AS acc,
            COUNT(*) AS qcount
          FROM base_questions
          GROUP BY subtopic_name
          HAVING COUNT(*) >= 2
          ORDER BY acc ASC, qcount DESC
          LIMIT 1
        ) fallback_rc

        UNION ALL

        -- 🥉 Final fallback: return NULL row if no data qualifies
        SELECT NULL, NULL, NULL
        LIMIT 1
      ),
      time_base AS (
        SELECT
          is_correct,
          time_spent,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_spent) OVER () AS median_time
        FROM base_questions
      ),
      time_counts AS (
        SELECT
          COUNT(*) FILTER (WHERE time_spent <= median_time AND is_correct = 0) AS fast_wrong,
          COUNT(*) FILTER (WHERE time_spent > median_time AND is_correct = 0) AS slow_wrong,
          COUNT(*) FILTER (WHERE time_spent > median_time AND is_correct = 1) AS slow_correct,
          COUNT(*) FILTER (WHERE time_spent <= median_time AND is_correct = 1) AS fast_correct,
          COUNT(*) FILTER (WHERE time_spent < 35 AND is_correct = 1) as stable_count,
          COUNT(*) FILTER (WHERE time_spent >= 35 AND is_correct = 1) as logic_count,
          COUNT(*) FILTER (WHERE is_correct = 0) as error_count
        FROM time_base
      ),
      time_pattern_cte AS (
        SELECT
          CASE
            WHEN slow_wrong >= fast_wrong AND slow_wrong >= slow_correct AND slow_wrong >= fast_correct AND slow_wrong > 0 THEN 'slow_and_wrong'
            WHEN fast_wrong >= slow_wrong AND fast_wrong >= slow_correct AND fast_wrong >= fast_correct AND fast_wrong > 0 THEN 'fast_and_wrong'
            WHEN slow_correct >= fast_wrong AND slow_correct >= slow_wrong AND slow_correct >= fast_correct AND slow_correct > 0 THEN 'slow_but_correct'
            ELSE 'fast_and_correct'
          END AS time_pattern,
          stable_count,
          logic_count,
          error_count
        FROM time_counts
      ),
      drop_off_cte AS (
        SELECT
          (COALESCE(AVG(is_correct) FILTER (WHERE difficulty = 'intermediate'), 0) - 
           COALESCE(AVG(is_correct) FILTER (WHERE difficulty = 'expert'), 0)) * 100 AS expert_drop_off
        FROM base_questions
      ),
      percentile_cte AS (
        WITH cohort_scores AS (
          SELECT
            e.id,
            AVG(eq.is_correct::int) * 100 AS score
          FROM exams e
          JOIN exam_questions eq ON eq.exam_id = e.id
          WHERE e.blueprint_id = (SELECT blueprint_id FROM exams WHERE id = ${examId})
            AND e.status = 'completed'
            AND e.completed_at >= NOW() - INTERVAL '30 days'
          GROUP BY e.id
        ),
        current_score AS (
          SELECT AVG(is_correct) * 100 AS score FROM base_questions
        )
        SELECT ROUND(
          100.0 * SUM(CASE WHEN c.score <= cs.score THEN 1 ELSE 0 END)
          / NULLIF(COUNT(*), 0),
        2) AS percentile
        FROM cohort_scores c, current_score cs
      ),
      subtopics_agg AS (
          SELECT JSON_AGG(r) as subtopics FROM (
              SELECT subtopic_name as name, ROUND(AVG(is_correct) * 100) as accuracy, COUNT(*) as attempts
              FROM base_questions
              GROUP BY subtopic_name
              ORDER BY accuracy DESC
          ) r
      ),
      skills_agg AS (
          SELECT JSON_AGG(r) as skills FROM (
              SELECT skill_name as name, ROUND(AVG(is_correct) * 100) as accuracy, COUNT(*) as attempts
              FROM base_questions
              WHERE skill_name IS NOT NULL
              GROUP BY skill_name
              ORDER BY attempts DESC
              LIMIT 4
          ) r
      ),
      heatmap_agg AS (
          SELECT JSON_AGG(r) as heatmap FROM (
              SELECT subtopic_name as subtopic, difficulty, ROUND(AVG(is_correct) * 100) as accuracy, COUNT(*) as attempts
              FROM base_questions
              GROUP BY subtopic_name, difficulty
          ) r
      ),
      difficulty_agg AS (
          SELECT JSON_AGG(r) as difficulty FROM (
              SELECT difficulty as level, ROUND(AVG(is_correct) * 100) as accuracy, COUNT(*) as attempts
              FROM base_questions
              GROUP BY difficulty
          ) r
      )
      SELECT
        s.score,
        s.question_count,
        s.total_time,
        m.mastery,
        r.readiness,
        p.percentile,
        c.confidence,
        c.is_inconsistent,
        rc.subtopic AS weakest_subtopic,
        rc.skill AS weakest_skill,
        rc.difficulty AS weakest_difficulty,
        tp.time_pattern,
        tp.stable_count,
        tp.logic_count,
        tp.error_count,
        COALESCE(do.expert_drop_off, 0) > 20 AS expert_drop_off,
        sa.subtopics,
        ska.skills,
        ha.heatmap,
        da.difficulty
      FROM score_cte s
      JOIN mastery_cte m ON TRUE
      JOIN readiness_cte r ON TRUE
      JOIN percentile_cte p ON TRUE
      JOIN confidence_cte c ON TRUE
      LEFT JOIN root_cause_cte rc ON TRUE
      JOIN time_pattern_cte tp ON TRUE
      JOIN drop_off_cte do ON TRUE
      CROSS JOIN subtopics_agg sa
      CROSS JOIN skills_agg ska
      CROSS JOIN heatmap_agg ha
      CROSS JOIN difficulty_agg da;
    `);

    type CoreRow = {
      score: number | null;
      question_count: number | null;
      total_time: number | null;
      mastery: number | null;
      readiness: number | null;
      percentile: number | null;
      confidence: string | null;
      is_inconsistent: boolean | null;
      weakest_subtopic: string | null;
      weakest_skill: string | null;
      weakest_difficulty: string | null;
      time_pattern: string | null;
      stable_count: number | null;
      logic_count: number | null;
      error_count: number | null;
      expert_drop_off: boolean | null;
      subtopics: { name: string; accuracy: number; attempts: number }[] | null;
      skills: { name: string; accuracy: number; attempts: number }[] | null;
      heatmap: { subtopic: string; difficulty: string; accuracy: number; attempts: number }[] | null;
      difficulty: { level: string; accuracy: number; attempts: number }[] | null;
    };

    const core = coreMetricsRaw.rows[0] as CoreRow;

    // Get raw questions for the audit list (this remains separate as it's a list)
    const rawQuestions = await db.execute(sql`
        SELECT 
            eq.id,
            q.question_text as text,
            eq.user_answer,
            q.correct_answer,
            q.explanation,
            eq.is_correct,
            (eq.response_metadata->>'timeSpentSeconds')::int as time_spent
        FROM exam_questions eq
        JOIN questions q ON q.id = eq.question_id
        WHERE eq.exam_id = ${examId}
        ORDER BY eq.id ASC
    `);

    return {
      examId: exam.id,
      score: Math.round(core.score ?? 0),
      mastery: Math.round(core.mastery ?? 0),
      readiness: Math.round(core.readiness ?? 0),
      percentile: Math.round(core.percentile ?? 50),
      confidence: core.confidence ?? 'LOW',
      isInconsistent: core.is_inconsistent ?? false,
      expertDropOff: core.expert_drop_off ?? false,
      timePattern: core.time_pattern ?? null,
      weakest_difficulty: core.weakest_difficulty ?? null,
      totalTimeSpentSeconds: core.total_time ?? 0,
      timeEfficiency: ((core.score ?? 0) > 80 && (core.total_time ?? 0) < ((core.question_count ?? 0) * 40)) ? 'FAST' : 'OPTIMAL',
      subtopics: core.subtopics ?? [],
      skills: core.skills ?? [],
      difficulty: (core.difficulty ?? []).map(d => ({ ...d, showNoData: d.attempts < 3 })),
      heatmap: (core.heatmap ?? []).map(h => ({ ...h, showNoData: h.attempts < 3 })),
      timeBuckets: {
        stable: core.stable_count ?? 0,
        logic: core.logic_count ?? 0,
        neural: core.error_count ?? 0
      },
      ai: {
        status: (core.score ?? 0) >= 80 ? 'READY' : ((core.score ?? 0) >= 60 ? 'BORDERLINE' : 'NOT_READY'),
        actions: [
            (core.weakest_subtopic ?? '').length > 0 ? `Review foundational logic for ${core.weakest_subtopic}` : "Expand into adjacent topics",
            (core.weakest_skill ?? '').length > 0 ? `Focus on ${core.weakest_skill} tactical drills` : "Maintain neural baseline stability",
            (core.expert_drop_off ?? false) ? "Bridge Intermediate to Expert gap" : "Challenge higher complexity vectors"
        ],
        weakest_subtopic: core.weakest_subtopic ?? undefined,
        weakest_skill: core.weakest_skill ?? undefined,
        nextExamHours: (core.score ?? 0) >= 80 ? 12 : 48
      },
      tutorInsights: await AdaptiveTutorService.generateInsights(
        exam.userId,
        (core.subtopics ?? []).map(s => ({
          topicId: s.name,
          accuracy: s.accuracy
        }))
      ),
      questions: rawQuestions.rows.map((q: {
        id: string;
        text: string;
        user_answer: string | null;
        correct_answer: string | null;
        explanation: string | null;
        is_correct: number | null;
        time_spent: number | null;
      }) => ({
        id: q.id,
        text: q.text,
        userAnswer: q.user_answer,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        isCorrect: q.is_correct === 1,
        timeSpent: q.time_spent ?? 0
      }))
    };
  }
}
