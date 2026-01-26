import { db, exams, resultsByDimension } from '@quiz/db';
import { eq, desc } from 'drizzle-orm';

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

  static async getExamReport(examId: string) {
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

    return {
      id: exam.id,
      score: correctAnswers,
      total: totalQuestions,
      percentage: scorePercentage,
      status: scorePercentage >= 70 ? 'passed' : 'failed',
      completedAt: exam.completedAt,
      blueprint: exam.blueprint,
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
        correctAnswer: eq.question.correctAnswer,
        isCorrect: eq.isCorrect,
      }))
    };
  }
}
