import { db, questions, examBlueprints, exams, examQuestions, topics, subjects } from '@quiz/db';
import { eq, inArray, sql, and, arrayContains, notInArray } from 'drizzle-orm';

export class SelectionEngine {
  /**
   * Selection logic: 30% Simple, 30% Intermediate, 40% Expert
   * Strictly enforces question counts per tier.
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
    const providedIds = config?.topics && config.topics.length > 0 ? config.topics : (blueprint.topics || []);
    const total = config?.questionCount || blueprint.totalQuestions || 10;
    const difficultyPref = config?.difficulty || 'mixed';

    // 2.1 Resolve Topic IDs
    let resolvedTopicIds: string[] = [];
    const linkedTopics = await db.query.topics.findMany({
      where: inArray(topics.subjectId, providedIds),
    });

    if (linkedTopics.length > 0) {
      resolvedTopicIds = linkedTopics.map(t => t.id);
    } else {
      resolvedTopicIds = providedIds;
    }

    if (resolvedTopicIds.length === 0) throw new Error('No topics found for the selected subjects.');

    // 3. Select Questions
    const selectedQuestions: any[] = [];
    
    const fetchFromPool = async (diffs: string[], count: number, excludeIds: string[]) => {
      return await db.query.questions.findMany({
        where: and(
          inArray(questions.topicId, resolvedTopicIds),
          inArray(questions.difficulty, diffs as any),
          excludeIds.length > 0 ? notInArray(questions.id, excludeIds) : undefined
        ),
        limit: count,
        orderBy: sql`RANDOM()`,
      });
    };

    if (difficultyPref === 'mixed') {
      const tiers = [
        { key: 'simple', target: Math.floor(total * 0.3) },
        { key: 'intermediate', target: Math.floor(total * 0.3) },
        { key: 'expert', target: total - Math.floor(total * 0.3) - Math.floor(total * 0.3) },
      ];

      for (const tier of tiers) {
        if (tier.target <= 0) continue;
        const pooled = await fetchFromPool([tier.key], tier.target, selectedQuestions.map(q => q.id));
        selectedQuestions.push(...pooled);
      }
    } else {
      const pooled = await fetchFromPool([difficultyPref], total, []);
      selectedQuestions.push(...pooled);
    }

    // Strict validation: Must meet the total requirement perfectly
    if (selectedQuestions.length < total) {
      throw new Error(`Insufficient questions found for the selected configuration. Found ${selectedQuestions.length}/${total}. Please add more questions to the database for these topics or reduce the question count request.`);
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

