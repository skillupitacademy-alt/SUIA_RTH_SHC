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

  private static async calculatePercentile(examId: string, blueprintId: string | null, _score: number): Promise<number> {
    try {
        let whereClause = eq(exams.status, 'completed');
        
        if (blueprintId !== undefined && blueprintId !== null) {
            whereClause = and(eq(exams.status, 'completed'), eq(exams.blueprintId, blueprintId))!;
        }

        const allExams = await db.query.exams.findMany({
            where: whereClause,
            columns: {
                totalScore: true,
                id: true
            }
        });

        if (allExams.length <= 1) return 99; // Only this exam exists

        // Calculate score percentage for current exam (assuming 'score' passed in is raw count)
        // Wait, 'score' passed in is correctAnswers count. We need percentage to compare with totalScore in DB.
        // But we don't know totalQuestions here easily without querying blueprint/questions again.
        // Actually, the caller calculates 'scorePercentage'. Let's trust the caller to pass percentage?
        // NO, the caller passes 'correctAnswers' as 'score'.
        // Let's rely on the FACT that the current exam is also in 'allExams' (if it is completed/updated).
        // If the current exam is not yet 'completed' in DB when this runs? 
        // getExamReport runs typically after submission.
        
        // Let's assume the current exam IS in the list.
        const currentExamWithType = allExams.find(e => e.id === examId);
        const myScore = (currentExamWithType !== undefined && currentExamWithType !== null && currentExamWithType.totalScore !== null) ? currentExamWithType.totalScore : 0;

        const lowerScores = allExams.filter(e => (e.totalScore !== null ? e.totalScore : 0) < myScore).length;
        const percentile = Math.round((lowerScores / allExams.length) * 100);

        return Math.max(1, percentile); // Minimum 1st percentile
    } catch (e) {
        ReportEngine.log.error(
          { examId, blueprintId, error: e instanceof Error ? e.message : 'unknown error' },
          'Percentile calculation failed',
        );
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

    // Calculate Time Taken
    let timeTaken = "00m 00s";
    if ((exam.completedAt !== null && exam.completedAt !== undefined) && (exam.startedAt !== null && exam.startedAt !== undefined)) {
        const diffMs = exam.completedAt.getTime() - exam.startedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        timeTaken = `${diffMins}m ${diffSecs}s`;
    }

    // Calculate Percentile
    const percentile = await ReportEngine.calculatePercentile(exam.id, exam.blueprintId, correctAnswers);

    const includeCorrect = options.includeCorrectAnswers === true;
    const actionPlan = ActionPlanBuilder.build(results);

    // Phase 3: Adaptive Tutor Insights
    const topicResults = results.filter(r => r.dimensionType === 'topic');
    const topicAccuracyRecords = topicResults.map(r => ({
      topicId: r.dimensionId!,
      accuracy: r.accuracy
    }));
    const tutorInsights = await AdaptiveTutorService.generateInsights(exam.userId, topicAccuracyRecords);

    return {
      id: exam.id,
      userId: exam.userId,
      status: exam.status,
      score: correctAnswers,
      total: totalQuestions,
      percentage: scorePercentage,
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
}
