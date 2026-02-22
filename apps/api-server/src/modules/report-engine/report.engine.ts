import { db, exams, resultsByDimension } from "@quiz/db";
import { and, desc, eq, sql } from "drizzle-orm";

import { logger } from "@/lib/logger";

import { AdaptiveTutorService } from "../adaptive-engine/adaptive-tutor.service";
import { PerformanceService } from "./performance.service";
import { ReportInterpreter } from "./report-interpreter.service";

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
  stable_time_sec: number | null;
  logic_time_sec: number | null;
  neural_time_sec: number | null;
  expert_drop_off: boolean | null;
  subtopics: { topicId: string; name: string; accuracy: number; attempts: number }[] | null;
  skills: { name: string; accuracy: number; attempts: number }[] | null;
  heatmap: { subtopic: string; difficulty: string; accuracy: number | null; attempts: number }[] | null;
  difficulty: { level: string; accuracy: number | null; attempts: number }[] | null;
};

type RawQuestionRow = {
  id: string;
  text: string;
  user_answer: string | null;
  correct_answer: string | null;
  explanation: string | null;
  is_correct: number | null;
  time_spent: number | null;
};

export type PremiumReport = {
  examId: string;
  score: number;
  mastery: number;
  readiness: number;
  percentile: number;
  confidence: string;
  isInconsistent: boolean;
  expertDropOff: boolean;
  timePattern: string | null;
  weakest_difficulty: string | null;
  totalTimeSpentSeconds: number;
  timeEfficiency: 'FAST' | 'OPTIMAL';
  subtopics: { name: string; accuracy: number; attempts: number; showNoData?: boolean }[];
  skills: { name: string; accuracy: number; attempts: number }[];
  difficulty: { level: string; accuracy: number | null; attempts: number; showNoData?: boolean }[];
  heatmap: { subtopic: string; difficulty: string; accuracy: number | null; attempts: number; showNoData?: boolean }[];
  timeBuckets: { stable: number; logic: number; neural: number };
  ai: {
    status: 'READY' | 'BORDERLINE' | 'NOT_READY' | 'DATA_INSUFFICIENT';
    actions: string[];
    weakest_subtopic?: string;
    weakest_skill?: string;
    nextExamHours: number;
  };
  tutorInsights: Array<{ topicId: string; accuracy: number }> | string;
  questions: {
    id: string;
    text: string;
    userAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    isCorrect: boolean;
    timeSpent: number;
  }[];
  interpreter?: {
    kpi: string[];
    subtopics: string[];
    skills: string[];
    heatmap: string[];
    difficulty: string[];
    time: string[];
    meta: string[];
  };
};

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

        if (cohort.length <= 1) return 50;

        const accuracies = cohort.map(e => {
            const total = e.examQuestions?.length ?? 0;
            const correct = e.examQuestions?.filter(q => q.isCorrect === true).length ?? 0;
            return total > 0 ? (correct / total) * 100 : 0;
        });

        const lowerScores = accuracies.filter(acc => acc < myAccuracy).length;
        const percentile = (lowerScores / cohort.length) * 100;
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
    
    const tutorInsights = topicAccuracyRecords.length > 0 
      ? await AdaptiveTutorService.generateInsights(exam.userId, topicAccuracyRecords)
      : "Baseline performance data established.";

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

  static async getPremiumExamReport(examId: string): Promise<PremiumReport> {
    // 1. Check Redis Cache First
    const cached = await PerformanceService.getCachedReport<PremiumReport>(examId);
    if (cached !== null) return cached;

    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        blueprint: true,
      }
    });

    if (exam === undefined || exam === null) throw new Error('Exam not found');

    const runCoreQuery = async () => {
        const res = await db.execute(sql`
        WITH analytics AS (
            SELECT * FROM attempt_analytics_mv WHERE exam_id = ${examId}
        ),
        dims AS (
            SELECT * FROM attempt_dimension_accuracy_mv WHERE exam_id = ${examId}
        ),
        subtopics_agg AS (
            SELECT JSON_AGG(r) as subtopics FROM (
            SELECT topic_id as "topicId", subtopic as name, ROUND(AVG(accuracy)) as accuracy, SUM(attempts) as attempts
            FROM dims
            GROUP BY topic_id, subtopic
            ORDER BY accuracy DESC
            ) r
        ),
        skills_agg AS (
            SELECT JSON_AGG(r) as skills FROM (
            SELECT skill as name, ROUND(AVG(accuracy)) as accuracy, SUM(attempts) as attempts
            FROM dims
            WHERE skill IS NOT NULL
            GROUP BY skill
            ORDER BY attempts DESC
            LIMIT 4
            ) r
        ),
        heatmap_agg AS (
            SELECT JSON_AGG(r) as heatmap FROM (
            SELECT subtopic, level as difficulty, ROUND(accuracy) as accuracy, attempts
            FROM dims
            ) r
        ),
        difficulty_agg AS (
            SELECT JSON_AGG(r) as difficulty FROM (
            SELECT level, ROUND(AVG(accuracy)) as accuracy, SUM(attempts) as attempts
            FROM dims
            GROUP BY level
            ) r
        ),
        root_cause_cte AS (
            SELECT subtopic, skill, level as difficulty
            FROM (
            SELECT subtopic, skill, level, accuracy, attempts
            FROM dims
            WHERE attempts >= 1
            ORDER BY accuracy ASC, attempts DESC
            LIMIT 1
            ) primary_rc
            UNION ALL
            SELECT subtopic, NULL AS skill, NULL AS difficulty
            FROM (
            SELECT subtopic, AVG(accuracy) as accuracy, SUM(attempts) as attempts
            FROM dims
            GROUP BY subtopic
            ORDER BY accuracy ASC, attempts DESC
            LIMIT 1
            ) fallback_rc
            UNION ALL
            SELECT NULL, NULL, NULL
            LIMIT 1
        ),
        variance_cte AS (
            SELECT 
            VAR_SAMP(accuracy) as variance
            FROM (
            SELECT subtopic, AVG(accuracy) as accuracy FROM dims GROUP BY subtopic
            ) v
        ),
        percentile_calc AS (
            SELECT COALESCE(
            (
                SELECT ROUND(
                100.0 * SUM(CASE WHEN c.score <= (SELECT score FROM analytics) THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*), 0),
                2)
                FROM (
                SELECT
                    e.id,
                    am.score
                FROM exams e
                JOIN attempt_analytics_mv am ON am.exam_id = e.id
                WHERE (e.blueprint_id = (SELECT blueprint_id FROM exams WHERE id = ${examId}) OR (e.blueprint_id IS NULL AND (SELECT blueprint_id FROM exams WHERE id = ${examId}) IS NULL))
                    AND e.status = 'completed'
                    AND e.completed_at >= NOW() - INTERVAL '30 days'
                GROUP BY e.id, am.score
                ) c
            ),
            50
            ) AS percentile
        )
        SELECT
            a.score,
            a.question_count,
            a.total_time,
            a.mastery,
            ROUND(COALESCE(a.score, 0) * 0.5 + COALESCE(a.mh_accuracy, 0) * 0.3 + 20, 2) AS readiness,
            p2.percentile,
            CASE
                WHEN a.question_count < 10 THEN 'LOW'
                WHEN COALESCE(v.variance, 0) > 0.05 THEN 'MEDIUM'
                WHEN NOT EXISTS (SELECT 1 FROM dims WHERE level IN ('intermediate', 'expert')) THEN 'LOW'
                ELSE 'HIGH'
            END AS confidence,
            COALESCE(v.variance, 0) > 0.15 AS is_inconsistent,
            rc.subtopic AS weakest_subtopic,
            rc.skill AS weakest_skill,
            rc.difficulty AS weakest_difficulty,
            CASE
                WHEN a.slow_wrong >= a.fast_wrong
                     AND a.slow_wrong >= a.slow_correct
                     AND a.slow_wrong >= a.fast_correct THEN 'slow_and_wrong'
                WHEN a.fast_wrong >= a.slow_wrong
                     AND a.fast_wrong >= a.fast_correct
                     AND a.fast_wrong >= a.slow_correct THEN 'fast_and_wrong'
                WHEN a.slow_correct >= a.fast_wrong
                     AND a.slow_correct >= a.slow_wrong
                     AND a.slow_correct >= a.fast_correct THEN 'slow_but_correct'
                ELSE 'fast_and_correct'
            END AS time_pattern,
            a.stable_count,
            a.logic_count,
            a.error_count,
            a.stable_time_sec,
            a.logic_time_sec,
            a.neural_time_sec,
            COALESCE(
            (SELECT AVG(accuracy) FROM dims WHERE level = 'intermediate') - 
            (SELECT AVG(accuracy) FROM dims WHERE level = 'expert'), 0
            ) > 20 as expert_drop_off,
            sa.subtopics,
            ska.skills,
            hl.heatmap,
            da.difficulty
        FROM (SELECT 1 as pillar) p
        LEFT JOIN analytics a ON TRUE
        LEFT JOIN subtopics_agg sa ON TRUE
        LEFT JOIN skills_agg ska ON TRUE
        LEFT JOIN heatmap_agg hl ON TRUE
        LEFT JOIN difficulty_agg da ON TRUE
        LEFT JOIN root_cause_cte rc ON TRUE
        LEFT JOIN variance_cte v ON TRUE
        LEFT JOIN percentile_calc p2 ON TRUE
        LIMIT 1;
        `);
        return res;
    };

    let coreMetricsRaw = await runCoreQuery();

    // Lazy Refresh: If the primary row is empty (MV not refreshed for this attempt)
    if (coreMetricsRaw.rows.length === 0 || (coreMetricsRaw.rows[0] as CoreRow).score === null) {
        ReportEngine.log.info({ examId }, 'Analytic row missing in MV, triggering lazy refresh');
        await PerformanceService.refreshAnalytics();
        coreMetricsRaw = await runCoreQuery();
    }

    if (coreMetricsRaw.rows.length === 0 || (coreMetricsRaw.rows[0] as CoreRow).score === null) {
        throw new Error('Analytics not precomputed for this exam even after refresh.');
    }

    const core = coreMetricsRaw.rows[0] as CoreRow;

    const rawQuestions = await db.execute(sql`
        SELECT 
            eq.id,
            q.question_text as text,
            eq.user_answer,
            q.correct_answer,
            q.explanation,
            eq.is_correct::int as is_correct,
            (eq.response_metadata->>'timeSpentSeconds')::int as time_spent
        FROM exam_questions eq
        JOIN questions q ON q.id = eq.question_id
        WHERE eq.exam_id = ${examId}
        ORDER BY eq.id ASC
    `);

    const finalReport: PremiumReport = {
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
      difficulty: (core.difficulty ?? []).map(d => ({ ...d, showNoData: d.attempts < 1 })),
      heatmap: (core.heatmap ?? []).map(h => ({ ...h, showNoData: h.attempts < 1 })),
      timeBuckets: {
        stable: core.stable_time_sec ?? 0,
        logic: core.logic_time_sec ?? 0,
        neural: core.neural_time_sec ?? 0
      },
      ai: {
        status: (core.score === null) ? 'DATA_INSUFFICIENT' : ((core.score ?? 0) >= 80 ? 'READY' : ((core.score ?? 0) >= 60 ? 'BORDERLINE' : 'NOT_READY')),
        actions: (core.score === null || core.confidence === 'LOW') ? [
            "Complete more assessments to generate tactical signals",
            "Focus on core foundational patterns first",
            "Stability status: Awaiting baseline data"
        ] : ((core.score ?? 0) >= 95 ? [
            "Maintain current performance baseline",
            "Expand into Expert-level edge cases",
            "Final verification of neural stability"
        ] : [
            (core.weakest_subtopic ?? '').length > 0 ? `Review foundational logic for ${core.weakest_subtopic}` : "Expand into adjacent topics",
            (core.weakest_skill ?? '').length > 0 ? `Focus on ${core.weakest_skill} tactical drills` : "Maintain neural baseline stability",
            (core.expert_drop_off ?? false) ? "Bridge Intermediate to Expert gap" : "Challenge higher complexity vectors"
        ]),
        weakest_subtopic: core.weakest_subtopic ?? undefined,
        weakest_skill: core.weakest_skill ?? undefined,
        nextExamHours: (core.score ?? 0) >= 80 ? 12 : 48
      },
      tutorInsights: await (async () => {
        if (core.score === null) return "Data insufficient for personalized AI tutoring. Please complete the assessment to unlock insights.";
        
        const topicAgg = (core.subtopics ?? []).reduce((acc, curr) => {
          const tid = curr.topicId;
          if (!tid) return acc;
          if (acc[tid] === undefined) acc[tid] = { topicId: tid, total: 0, count: 0 };
          acc[tid].total += curr.accuracy ?? 0;
          acc[tid].count += 1;
          return acc;
        }, {} as Record<string, { topicId: string, total: number, count: number }>);

        const records = Object.values(topicAgg).map(t => ({
          topicId: t.topicId,
          accuracy: t.count > 0 ? t.total / t.count : 0
        }));

        // Suppress conceptual gaps for near-perfect scores, but keep contract as an array
        if ((core.score ?? 0) >= 95) return [];

        return AdaptiveTutorService.generateInsights(exam.userId, records);
      })(),
      questions: (rawQuestions.rows as RawQuestionRow[]).map((q) => ({
        id: q.id,
        text: q.text,
        userAnswer: q.user_answer,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        isCorrect: q.is_correct === 1,
        timeSpent: q.time_spent ?? 0
      }))
    };

    // 2. Synthesize Deterministic Interpretation
    finalReport.interpreter = ReportInterpreter.interpret(finalReport);

    // Phase 1: Cache result for subsequent hits
    await PerformanceService.cacheReport(examId, finalReport);

    return finalReport;
  }
}
