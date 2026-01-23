import { db, examQuestions, resultsByDimension, exams, questions } from '@quiz/db';
import { eq, and } from 'drizzle-orm';
export const dynamic = 'force-dynamic';

export class ScoringEngine {
  static async calculateExamResults(examId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          with: {
            question: true,
          }
        }
      }
    });

    if (!exam) throw new Error('Exam not found');

    const dimensions: Record<string, { total: number; correct: number }> = {};

    // 1. Analyze performance by various dimensions
    for (const eq of exam.examQuestions) {
      if (eq.isCorrect === null) continue;

      const q = eq.question;
      const dims = [
        { type: 'topic', id: q.topicId },
        { type: 'difficulty', id: q.difficulty }, // Note: id here is a string value for simplicity in logic
      ];

      for (const d of dims) {
        const key = `${d.type}:${d.id}`;
        if (!dimensions[key]) dimensions[key] = { total: 0, correct: 0 };
        dimensions[key].total++;
        if (eq.isCorrect) dimensions[key].correct++;
      }
    }

    // 2. Save dimensional results
    const resultsData = Object.entries(dimensions).map(([key, stats]) => {
      const [type, id] = key.split(':');
      return {
        examId,
        dimensionType: type,
        dimensionId: id === 'simple' || id === 'intermediate' || id === 'expert' ? null : (id as string),
        score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      };
    });

    if (resultsData.length > 0) {
      await db.insert(resultsByDimension).values(resultsData as any);
    }

    // 3. Update total score
    const totalCorrect = exam.examQuestions.filter(q => q.isCorrect).length;
    const finalScore = Math.round((totalCorrect / exam.examQuestions.length) * 100);

    await db.update(exams)
      .set({ totalScore: finalScore, completedAt: new Date(), status: 'completed' })
      .where(eq(exams.id, examId));

    return finalScore;
  }
}
