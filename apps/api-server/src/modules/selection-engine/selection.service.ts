import { db, questions, examBlueprints, exams, examQuestions, topics, subtopics, subjects as subjectsTable } from '@quiz/db';
import { eq, inArray, sql, and, or, notInArray } from 'drizzle-orm';

export class SelectionEngine {
  /**
   * Selection logic: 30% Simple, 30% Intermediate, 40% Expert
   * Strictly enforces question counts per tier.
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

    // Relaxed validation: Check if we have at least SOME level of hierarchy
    if (!domainId || (finalSubjectIds.length === 0 && finalTopicIds.length === 0 && finalSubtopicIds.length === 0)) {
       throw new Error('Minimum selection criteria (Subject, Topic or Subtopic) required to compose an exam.');
    }

    const total = questionCount || blueprint?.totalQuestions || 10;
    const difficultyPref = difficulty || 'mixed';

    // 2. Resolve Effective Leaf Selections for hierarchical filtering
    // If a child is selected, it narrows the parent.
    
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

    // Strict validation
    if (selectedQuestions.length < total) {
      throw new Error(`Insufficient questions found for the selected configuration. Found ${selectedQuestions.length}/${total}. Please add more questions to the database for these areas or reduce the question count request.`);
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

