import { db, exams, resultsByDimension } from "@quiz/db";
import { and, desc, eq } from "drizzle-orm";

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
        examQuestions: {
          with: {
            question: { with: { subtopic: true } },
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

    // 1. Weighted Mastery Logic: Use total counts instead of unweighted topic averages
    const topicResults = results.filter(r => r.dimensionType === 'topic');
    let totalAttempts = 0;
    let totalCorrectFromTopics = 0;
    topicResults.forEach(r => {
        // Reconstruct attempts from accuracy and score (score is usually the count of correct answers in this context)
        const attempts = r.accuracy > 0 ? (r.score / (r.accuracy / 100)) : 0;
        totalAttempts += attempts;
        totalCorrectFromTopics += r.score;
    });
    const weightedMastery = totalAttempts > 0 ? (totalCorrectFromTopics / totalAttempts) * 100 : scorePercentage;

    // 2. Clamped Readiness Formula
    const rawReadiness = (scorePercentage * 0.4) + (weightedMastery * 0.4) + 20;
    const readiness = Math.min(100, Math.max(0, Math.round(rawReadiness)));

    // 3. Subtopic Aggregation (Using ID for reliability)
    const subtopicMap = new Map<string, { total: number; correct: number; name: string }>();
    exam.examQuestions.forEach(eq => {
      const sub = eq.question.subtopic;
      if (sub === null || sub === undefined) return;
      const stats = subtopicMap.get(sub.id) || { total: 0, correct: 0, name: sub.name };
      stats.total++;
      if (eq.isCorrect === true) stats.correct++;
      subtopicMap.set(sub.id, stats);
    });

    const subtopicsList = Array.from(subtopicMap.values()).map(s => ({
      name: s.name,
      accuracy: Math.round((s.correct / s.total) * 100),
      attempts: s.total
    })).sort((a, b) => b.accuracy - a.accuracy);

    // 4. Heatmap Full Coverage Logic
    const difficultyLevels = ['simple', 'intermediate', 'expert'] as const;
    const heatmapList: { subtopic: string; difficulty: string; accuracy: number; attempts: number }[] = [];
    
    subtopicMap.forEach((subData, _subId) => {
      difficultyLevels.forEach(diff => {
        const matchingQuestions = exam.examQuestions.filter(eq => 
          eq.question.subtopicId === _subId && eq.question.difficulty === diff
        );
        heatmapList.push({
          subtopic: subData.name,
          difficulty: diff,
          accuracy: matchingQuestions.length > 0 
            ? Math.round((matchingQuestions.filter(q => q.isCorrect === true).length / matchingQuestions.length) * 100) 
            : 0,
          attempts: matchingQuestions.length
        });
      });
    });

    // 5. Time Spent Categories for WOW Donut
    const timeBuckets = { stable: 0, logic: 0, neural: 0 };
    exam.examQuestions.forEach(eq => {
        const time = (eq.responseMetadata as Record<string, unknown>)?.timeSpentSeconds as number || 0;
      if (eq.isCorrect === true) {
        if (time < 35) timeBuckets.stable++; // Quick/Stable
        else timeBuckets.logic++; // Logic synthesis
      } else {
        timeBuckets.neural++; // Neural friction/Error
      }
    });

    const skillResults = results.filter(r => r.dimensionType === 'skill');
    const skillsList = Array.from(
      new Map(
        skillResults.map(r => {
          const attemptsRaw = (r as { attempts?: unknown }).attempts;
          const attempts = typeof attemptsRaw === 'number' && !Number.isNaN(attemptsRaw) ? attemptsRaw : 0;
          const name = r.name ?? 'Unknown';
          return [name, { name, accuracy: r.accuracy, attempts }];
        })
      ).values()
    )
      .filter(s => s.name !== 'Unknown')
      .sort((a, b) => b.attempts - a.attempts) // Prioritize skills with more data
      .slice(0, 4); // Strictly limit to 4 as per design requirement

    // 6. Impact-Based Guards (Ignore single-attempt noise for weakest picks)
    const significantSubtopics = subtopicsList.filter(s => s.attempts !== undefined && s.attempts >= 1); // For small exams, 1 is okay, but we prioritize accuracy
    const weakestSubtopic = significantSubtopics.length > 0 ? significantSubtopics.sort((a, b) => a.accuracy - b.accuracy)[0] : null;
    const weakestSkill = skillsList.length > 0 ? skillsList.sort((a, b) => a.accuracy - b.accuracy)[0] : null;

    const actions: string[] = [];
    if (weakestSubtopic && weakestSubtopic.accuracy < 60) {
      actions.push(`Review foundational logic for ${weakestSubtopic.name}`);
    }
    if (weakestSkill && weakestSkill.accuracy < 60) {
      actions.push(`Focus on ${weakestSkill.name} tactical drills`);
    }
    
    const intermediateAccuracy = heatmapList.filter(h => h.difficulty === 'intermediate').reduce((acc, curr) => acc + curr.accuracy, 0) / (subtopicMap.size || 1);
    if (intermediateAccuracy < 50) {
      actions.push("Stabilize intermediate difficulty mastery before moving to expert");
    }
    if (scorePercentage < 70) {
      actions.push("Review incorrect answers with explanation tool");
    }
    if (actions.length < 3) {
      actions.push("Expand into adjacent topics to maintain neural elasticity");
    }

    const totalTimeSpentSeconds = exam.examQuestions.reduce((acc, eq) => 
      acc + ((eq.responseMetadata as Record<string, unknown>)?.timeSpentSeconds as number || 0), 0);
    
    const percentile = await ReportEngine.calculatePercentile(exam.id, exam.blueprintId, scorePercentage);

    return {
      examId: exam.id,
      score: Math.round(scorePercentage),
      mastery: Math.round(weightedMastery),
      readiness,
      percentile,
      totalTimeSpentSeconds,
      timeEfficiency: (scorePercentage > 80 && totalTimeSpentSeconds < (totalQuestions * 40)) ? 'FAST' : 'OPTIMAL',
      subtopics: subtopicsList,
      skills: skillsList,
      difficulty: difficultyLevels.map(level => {
          const matching = exam.examQuestions.filter(q => q.question.difficulty === level);
          return {
              level,
              accuracy: matching.length > 0 ? Math.round((matching.filter(q => q.isCorrect === true).length / matching.length) * 100) : 0,
              attempts: matching.length
          };
      }),
      heatmap: heatmapList,
      timeBuckets,
      ai: {
        status: scorePercentage >= 80 ? 'READY' : (scorePercentage >= 60 ? 'BORDERLINE' : 'NOT_READY'),
        actions: actions.slice(0, 4),
        weakest_subtopic: weakestSubtopic?.name,
        weakest_skill: weakestSkill?.name,
        nextExamHours: scorePercentage >= 80 ? 12 : 48
      },
      tutorInsights: await AdaptiveTutorService.generateInsights(exam.userId, topicResults.map(tr => ({
        topicId: tr.dimensionId!,
        accuracy: tr.accuracy
      }))),
      questions: exam.examQuestions.map(eq => ({
        id: eq.id,
        text: eq.question.questionText,
        userAnswer: eq.userAnswer,
        correctAnswer: eq.question.correctAnswer,
        explanation: eq.question.explanation,
        isCorrect: eq.isCorrect,
        timeSpent: (eq.responseMetadata as Record<string, unknown>)?.timeSpentSeconds as number || 0,
      }))
    };
  }
}
