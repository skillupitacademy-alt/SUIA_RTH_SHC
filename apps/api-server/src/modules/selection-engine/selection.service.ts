import { db, questions, examBlueprints, exams, examQuestions } from '@quiz/db';
import { eq, inArray, sql, and } from 'drizzle-orm';

export class SelectionEngine {
  /**
   * Selection logic: 30% Simple, 30% Intermediate, 40% Expert
   */
  static async composeExam(userId: string, blueprintId: string) {
    const blueprint = await db.query.examBlueprints.findFirst({
      where: eq(examBlueprints.id, blueprintId),
    });

    if (!blueprint) throw new Error('Blueprint not found');

    const topicIds = blueprint.topics || [];
    const total = blueprint.totalQuestions;

    const targets = {
      simple: Math.floor(total * 0.3),
      intermediate: Math.floor(total * 0.3),
      expert: total - Math.floor(total * 0.3) - Math.floor(total * 0.3),
    };

    const selectedQuestions: any[] = [];

    // Fetch pooled questions for each difficulty
    for (const [diff, count] of Object.entries(targets)) {
      const pooled = await db.query.questions.findMany({
        where: and(
          inArray(questions.topicId, topicIds),
          eq(questions.difficulty, diff as any)
        ),
        limit: count,
        orderBy: sql`RANDOM()`, // Random selection
      });
      selectedQuestions.push(...pooled);
    }

    // Create Exam instance
    return await db.transaction(async (tx) => {
      const [exam] = await tx.insert(exams).values({
        userId,
        blueprintId: blueprint.id,
        status: 'started',
      }).returning();

      const examQuestionsData = selectedQuestions.map((q, index) => ({
        examId: exam.id,
        questionId: q.id,
        order: index + 1,
      }));

      await tx.insert(examQuestions).values(examQuestionsData);
      return exam;
    });
  }
}
