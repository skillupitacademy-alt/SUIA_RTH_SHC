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

        if (allExams.length <= 1) return 99;

        const currentExamWithType = allExams.find(e => e.id === examId);
        const myScore = (currentExamWithType !== undefined && currentExamWithType !== null && currentExamWithType.totalScore !== null) ? currentExamWithType.totalScore : 0;

        const lowerScores = allExams.filter(e => (e.totalScore !== null ? e.totalScore : 0) < myScore).length;
        const percentile = Math.round((lowerScores / allExams.length) * 100);

        return Math.max(1, percentile);
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

    let timeTaken = "00m 00s";
    if ((exam.completedAt !== null && exam.completedAt !== undefined) && (exam.startedAt !== null && exam.startedAt !== undefined)) {
        const diffMs = exam.completedAt.getTime() - exam.startedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        timeTaken = `${diffMins}m ${diffSecs}s`;
    }

    const percentile = await ReportEngine.calculatePercentile(exam.id, exam.blueprintId, correctAnswers);
    const includeCorrect = options.includeCorrectAnswers === true;
    const actionPlan = ActionPlanBuilder.build(results);

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

  static async getPremiumExamReport(examId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          with: {
            question: {
              with: {
                subtopic: true
              }
            },
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
    const scorePercentage = Math.round(totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0);

    const topicResults = results.filter(r => r.dimensionType === 'topic');
    const mastery = Math.round(topicResults.length > 0 
      ? topicResults.reduce((acc, curr) => acc + curr.accuracy, 0) / topicResults.length 
      : scorePercentage);

    const readiness = Math.round((scorePercentage * 0.4) + (mastery * 0.4) + (20));

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
      accuracy: Math.round((s.correct / s.total) * 100)
    })).sort((a, b) => b.accuracy - a.accuracy);

    const diffMap = { simple: { t: 0, c: 0 }, intermediate: { t: 0, c: 0 }, expert: { t: 0, c: 0 } };
    exam.examQuestions.forEach(eq => {
      const d = eq.question.difficulty as 'simple' | 'intermediate' | 'expert';
      if (diffMap[d] !== undefined) {
        diffMap[d].t++;
        if (eq.isCorrect === true) diffMap[d].c++;
      }
    });

    const difficultyList = (['simple', 'intermediate', 'expert'] as const).map(level => ({
      level,
      accuracy: diffMap[level].t > 0 ? Math.round((diffMap[level].c / diffMap[level].t) * 100) : 0
    }));

    const heatmapList: { subtopic: string; difficulty: 'simple' | 'intermediate' | 'expert'; accuracy: number }[] = [];
    const uniqueSubtopics = Array.from(subtopicMap.values()).map(s => s.name);
    
    uniqueSubtopics.forEach(subName => {
      ['simple', 'intermediate', 'expert'].forEach(diff => {
        const matchingQuestions = exam.examQuestions.filter(eq => 
          eq.question.subtopic?.name === subName && eq.question.difficulty === diff
        );
        if (matchingQuestions.length > 0) {
          const correct = matchingQuestions.filter(q => q.isCorrect === true).length;
          heatmapList.push({
            subtopic: subName,
            difficulty: diff,
            accuracy: Math.round((correct / matchingQuestions.length) * 100)
          });
        }
      });
    });

    const skillResults = results.filter(r => r.dimensionType === 'skill');
    const skillsList = skillResults.map(r => ({
      name: r.name ?? 'Unknown',
      accuracy: r.accuracy
    }));

    const weakestSubtopic = subtopicsList.length > 0 ? subtopicsList[subtopicsList.length - 1] : null;
    const weakestSkill = skillsList.length > 0 ? skillsList.sort((a, b) => a.accuracy - b.accuracy)[0] : null;

    const actions: string[] = [];
    if (weakestSubtopic !== null && weakestSubtopic.accuracy < 60) {
      actions.push(`Review foundational logic for ${weakestSubtopic.name}`);
    }
    if (weakestSkill !== null && weakestSkill.accuracy < 60) {
      actions.push(`Focus on ${weakestSkill.name} tactical drills`);
    }
    if (difficultyList[1].accuracy < 50) {
      actions.push("Stabilize intermediate difficulty mastery before moving to expert");
    }
    if (scorePercentage < 70) {
      actions.push("Review incorrect answers with explanation tool");
    }
    if (actions.length < 3) {
      actions.push("Expand into adjacent topics to maintain neural elasticity");
    }

    return {
      examId: exam.id,
      score: scorePercentage,
      mastery,
      readiness,
      subtopics: subtopicsList,
      skills: skillsList,
      difficulty: difficultyList,
      heatmap: heatmapList,
      ai: {
        status: scorePercentage >= 80 ? 'READY' : (scorePercentage >= 60 ? 'BORDERLINE' : 'NOT_READY'),
        actions: actions.slice(0, 4),
        weakest_subtopic: weakestSubtopic?.name,
        weakest_skill: weakestSkill?.name,
        nextExamHours: scorePercentage >= 80 ? 12 : 48
      }
    };
  }
}
