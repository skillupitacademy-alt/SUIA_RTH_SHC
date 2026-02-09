import { db, exams, resultsByDimension } from '@quiz/db';
import { eq, desc } from 'drizzle-orm';

export interface ActionPlanItem {
  id: string;
  priority: 'critical' | 'growth' | 'stable';
  label: string;
  recommendation: string;
  skills: string[];
  accuracy: number;
}

class ActionPlanBuilder {
  static build(results: any[]): ActionPlanItem[] {
    const skillResults = results.filter(r => r.dimensionType === 'skill');

    return skillResults
      .map(r => {
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
          id: r.dimensionId || r.name,
          priority,
          label,
          recommendation,
          skills: [r.name],
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
      averageScore: userExams.length > 0 ? userExams.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / userExams.length : 0,
      dimensions: userExams.flatMap(e => e.dimensions),
    };
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

    if (!exam) throw new Error('Exam not found');

    const results = await db.query.resultsByDimension.findMany({
      where: eq(resultsByDimension.examId, examId),
    });

    const totalQuestions = exam.examQuestions.length;
    const correctAnswers = exam.examQuestions.filter(eq => eq.isCorrect).length;
    const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    const includeCorrect = options.includeCorrectAnswers === true;
    const actionPlan = ActionPlanBuilder.build(results);

    return {
      id: exam.id,
      userId: exam.userId,
      status: exam.status,
      score: correctAnswers,
      total: totalQuestions,
      percentage: scorePercentage,
      statusLabel: scorePercentage >= 70 ? 'passed' : 'failed',
      completedAt: exam.completedAt,
      blueprint: exam.blueprint,
      actionPlan,
      performance: results.reduce((acc: any, r) => {
        if (!acc[r.dimensionType]) acc[r.dimensionType] = [];
        acc[r.dimensionType].push({
          id: r.dimensionId,
          name: r.name,
          score: r.score,
          accuracy: r.accuracy
        });
        return acc;
      }, {}),
      questions: exam.examQuestions.map(eq => ({
        text: eq.question.questionText,
        userAnswer: eq.userAnswer,
        correctAnswer: includeCorrect ? eq.question.correctAnswer : undefined,
        explanation: includeCorrect ? eq.question.explanation : undefined,
        isCorrect: eq.isCorrect,
        timeSpent: (eq.responseMetadata as any)?.timeSpentSeconds || 0,
      }))
    };
  }
}
