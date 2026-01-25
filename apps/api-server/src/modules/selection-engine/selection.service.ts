import { db, questions, examBlueprints, exams, examQuestions } from '@quiz/db';
import { eq, inArray, sql, and, arrayContains } from 'drizzle-orm';

export class SelectionEngine {
  /**
   * Selection logic: 30% Simple, 30% Intermediate, 40% Expert
   */
  static async composeExam(
    userId: string, 
    blueprintOrDomainId: string, 
    config?: { topics?: string[], questionCount?: number, difficulty?: string }
  ) {
    // 1. Resolve Blueprint
    let blueprint = await db.query.examBlueprints.findFirst({
      where: eq(examBlueprints.id, blueprintOrDomainId),
    });

    if (!blueprint) {
      blueprint = await db.query.examBlueprints.findFirst({
        where: sql`${examBlueprints.domains} @> ARRAY[${blueprintOrDomainId}]::uuid[]`,
      });
    }

    if (!blueprint) throw new Error('Blueprint not found');

    // 2. Determine Configuration
    const topicIds = config?.topics && config.topics.length > 0 ? config.topics : (blueprint.topics || []);
    const total = config?.questionCount || blueprint.totalQuestions || 10;
    const difficultyPref = config?.difficulty || 'mixed';

    if (topicIds.length === 0) throw new Error('No topics available for this exam');

    // 3. Select Questions
    const selectedQuestions: any[] = [];
    
    if (difficultyPref === 'mixed') {
      const targets = {
        simple: Math.floor(total * 0.3),
        intermediate: Math.floor(total * 0.3),
        expert: total - Math.floor(total * 0.3) - Math.floor(total * 0.3),
      };

      for (const [diff, count] of Object.entries(targets)) {
        if (count <= 0) continue;
        const pooled = await db.query.questions.findMany({
          where: and(
            inArray(questions.topicId, topicIds),
            eq(questions.difficulty, diff as any)
          ),
          limit: count,
          orderBy: sql`RANDOM()`,
        });
        selectedQuestions.push(...pooled);
      }
    } else {
      // Fixed difficulty selection
      const pooled = await db.query.questions.findMany({
        where: and(
          inArray(questions.topicId, topicIds),
          eq(questions.difficulty, difficultyPref as any)
        ),
        limit: total,
        orderBy: sql`RANDOM()`,
      });
      selectedQuestions.push(...pooled);
    }

    // Handle case where not enough questions were found
    if (selectedQuestions.length === 0) {
      throw new Error('Not enough questions found for the selected configuration');
    }

    // 4. Create Exam instance
    const [exam] = await db.insert(exams).values({
      userId,
      blueprintId: blueprint.id,
      status: 'started',
      totalScore: 0,
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
