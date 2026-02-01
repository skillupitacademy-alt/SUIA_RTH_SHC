import { db, questions, examBlueprints, exams, examQuestions, topics, subtopics, subjects as subjectsTable } from '@quiz/db';
import { eq, inArray, sql, and, or, notInArray } from 'drizzle-orm';

export class SelectionEngine {
  /**
   * Selection logic: 30% Simple, 30% Intermediate, 40% Expert
   * Strictly enforces question counts per tier as a MAXIMUM (Graceful Degradation).
   */
  static async composeExam(
    userId: string, 
    blueprintOrDomainId: string, 
    config?: { 
      subjectId?: string, // Legacy
      subjectIds?: string[], // New
      topics?: string[],  // Legacy
      topicIds?: string[], // New
      subtopicIds?: string[],
      questionCount?: number, 
      difficulty?: string 
    }
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

    // 1.5 STATIC OVERRIDE: If blueprint has fixed questionIds, bypass dynamic selection
    if (blueprint.questionIds && blueprint.questionIds.length > 0) {
      const staticQuestions = await db.query.questions.findMany({
        where: and(
          inArray(questions.id, blueprint.questionIds),
          eq(questions.status, 'active')
        )
      });

      if (staticQuestions.length === 0) {
        throw new Error('This static blueprint refers to questions that no longer exist or are inactive.');
      }

      // Create Exam instance immediately
      const [exam] = await db.insert(exams).values({
        userId,
        blueprintId: blueprint.id,
        status: 'started',
        totalScore: 0,
      }).returning();

      const examQuestionsData = staticQuestions.map((q, index) => ({
        examId: exam.id,
        questionId: q.id,
        order: index + 1,
      }));

      await db.insert(examQuestions).values(examQuestionsData);
      return { examId: exam.id, status: exam.status };
    }

    const domainId = blueprintOrDomainId; 
    const { 
      subjectId, 
      subjectIds: configSubjectIds,
      topics: legacyTopicIds, 
      topicIds: configTopicIds,
      subtopicIds = [],
      questionCount,
      difficulty 
    } = config || {};

    // Use either new or legacy parameters
    const finalSubjectIds = configSubjectIds || (subjectId ? [subjectId] : blueprint.subjects) || [];
    const finalTopicIds = configTopicIds || legacyTopicIds || blueprint.topics || [];
    const finalSubtopicIds = subtopicIds.length > 0 ? subtopicIds : (blueprint.subtopics || []);

    // FLEXIBLE VALIDATION: If we have a DomainID, that is sufficient. 
    // We only throw if BOTH domain and sub-selections are missing.
    if (!domainId) {
       throw new Error('Selection criteria (Domain, Subject, Topic or Subtopic) required to compose an exam.');
    }

    const requestedTotal = questionCount || blueprint?.totalQuestions || 10;
    const difficultyPref = difficulty || 'mixed';

    // 2. Resolve Effective Leaf Selections for hierarchical filtering
    // Find parent Topic IDs for selected Subtopics
    const selectedTopicParents: string[] = finalSubtopicIds.length > 0 
        ? (await db.select({ topicId: subtopics.topicId })
                  .from(subtopics)
                  .where(inArray(subtopics.id, finalSubtopicIds))
          ).map(r => r.topicId)
        : [];
    
    // "Actual" Topics = selected topics that have NO selected subtopics
    const actualTopicIds = finalTopicIds.filter(id => !selectedTopicParents.includes(id));
    
    // Find parent Subject IDs for selected Topics
    const selectedSubjectParents: string[] = finalTopicIds.length > 0 
        ? (await db.select({ subjectId: topics.subjectId })
                  .from(topics)
                  .where(inArray(topics.id, finalTopicIds))
          ).map(r => r.subjectId)
        : [];
    
    // "Actual" Subjects = selected subjects that have NO selected topics
    const actualSubjectIds = finalSubjectIds.filter(id => !selectedSubjectParents.includes(id));

    // 3. Select Questions
    const selectedQuestions: any[] = [];
    
    const fetchFromPool = async (diffs: string[], count: number, excludeIds: string[]) => {
      const subtopicCond = finalSubtopicIds.length > 0 ? inArray(questions.subtopicId, finalSubtopicIds) : null;
      const topicCond = actualTopicIds.length > 0 ? inArray(questions.topicId, actualTopicIds) : null;
      
      let subjectTopicCond = null;
      if (actualSubjectIds.length > 0) {
          const subQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, actualSubjectIds));
          subjectTopicCond = inArray(questions.topicId, subQuery);
      }

      // If NO specific subjects/topics provided, fallback to Domain
      let domainCond = null;
      if (!subtopicCond && !topicCond && !subjectTopicCond) {
          const subjectsSubQuery = db.select({ id: subjectsTable.id }).from(subjectsTable).where(eq(subjectsTable.domainId, domainId));
          const topicsSubQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, subjectsSubQuery));
          domainCond = inArray(questions.topicId, topicsSubQuery);
      }

      const hierarchyCond = or(
          subtopicCond || undefined, 
          topicCond || undefined, 
          subjectTopicCond || undefined, 
          domainCond || undefined
      );

      return await db.query.questions.findMany({
        where: and(
          hierarchyCond,
          inArray(questions.difficulty, diffs as any),
          excludeIds.length > 0 ? notInArray(questions.id, excludeIds) : undefined,
          eq(questions.status, 'active')
        ),
        limit: count,
        orderBy: sql`RANDOM()`,
      });
    };

    if (difficultyPref === 'mixed') {
      const tiers = [
        { key: 'simple', target: Math.floor(requestedTotal * 0.3) },
        { key: 'intermediate', target: Math.floor(requestedTotal * 0.3) },
        { key: 'expert', target: requestedTotal - Math.floor(requestedTotal * 0.3) - Math.floor(requestedTotal * 0.3) },
      ];

      for (const tier of tiers) {
        if (tier.target <= 0) continue;
        const pooled = await fetchFromPool([tier.key], tier.target, selectedQuestions.map(q => q.id));
        selectedQuestions.push(...pooled);
      }
    } else {
      const pooled = await fetchFromPool([difficultyPref], requestedTotal, []);
      selectedQuestions.push(...pooled);
    }

    // GRACEFUL DEGRADATION: We treat the requested count as a MAXIMUM.
    // We only throw if ZERO questions are found.
    if (selectedQuestions.length === 0) {
      throw new Error(`No questions found for the selected configuration. Please ensure the selected area has active questions.`);
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
