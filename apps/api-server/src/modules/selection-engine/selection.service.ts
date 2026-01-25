import { db, questions, examBlueprints, exams, examQuestions } from '@quiz/db';
import { eq, inArray, sql, and, arrayContains } from 'drizzle-orm';

export class SelectionEngine {
  /**
   * Selection logic: 30% Simple, 30% Intermediate, 40% Expert
   */
  static async composeExam(userId: string, blueprintOrDomainId: string) {
    // First, try to find as a blueprint ID
    let blueprint = await db.query.examBlueprints.findFirst({
      where: eq(examBlueprints.id, blueprintOrDomainId),
    });

    // If not found, treat it as a domain ID and find a blueprint for that domain
    if (!blueprint) {
      blueprint = await db.query.examBlueprints.findFirst({
        where: sql`${examBlueprints.domains} @> ARRAY[${blueprintOrDomainId}]::uuid[]`,
      });
    }

    if (!blueprint) throw new Error('Blueprint not found');

    const topicIds = blueprint.topics || [];
    if (topicIds.length === 0) return null; // Or handle as "all topics" depending on requirements
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
    const [exam] = await db.insert(exams).values({
      userId,
      blueprintId: blueprint.id,
      status: 'started',
    }).returning();

    const examQuestionsData = selectedQuestions.map((q, index) => ({
      examId: exam.id,
      questionId: q.id,
      order: index + 1,
    }));

    await db.insert(examQuestions).values(examQuestionsData);
    
    return { examId: exam.id, status: exam.status };
  }
}
