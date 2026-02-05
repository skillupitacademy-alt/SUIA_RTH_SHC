import { db, questions, examBlueprints, exams, examQuestions, topics, subtopics, subjects as subjectsTable } from '@quiz/db';
import { eq, inArray, sql, and, or, notInArray } from 'drizzle-orm';
import { cacheService } from '../core/cache.service';


export class SelectionEngine {
  /**
   * Selection logic: 30% Simple, 30% Intermediate, 40% Expert
   * Strictly enforces question counts per tier as a MAXIMUM (Graceful Degradation).
   * 
   * @returns { questions: any[], blueprint: any }
   */
  static async composeExam(
    userId: string, 
    blueprintOrDomainId: string, 
    config?: { 
      subjectId?: string, 
      subjectIds?: string[], 
      topics?: string[],  
      topicIds?: string[], 
      subtopicIds?: string[],
      questionCount?: number, 
      difficulty?: string 
    }
  ) {
    // 1. Resolve Blueprint
    const blueprintCacheKey = `blueprint:${blueprintOrDomainId}`;
    let blueprint: any = null;

    try {
      blueprint = await cacheService.get(blueprintCacheKey);
    } catch (e) {
      console.warn('[Selection] Cache lookup failed', e);
    }

    if (!blueprint) {
      blueprint = await db.query.examBlueprints.findFirst({
        where: eq(examBlueprints.id, blueprintOrDomainId),
      });

      if (!blueprint) {
        blueprint = await db.query.examBlueprints.findFirst({
          where: sql`${examBlueprints.domains} @> ARRAY[${blueprintOrDomainId}]::uuid[]`,
        });
      }

      if (blueprint) {
        try {
          await cacheService.set(blueprintCacheKey, blueprint, 1000 * 60 * 10);
        } catch (e) {
          console.warn('[Selection] Cache storage failed', e);
        }
      }
    }

    if (!blueprint) {
      // Decision 2: Option 2 - Virtual Blueprint Fallback
      blueprint = {
        id: null, // Virtual
        name: 'Quick Assessment',
        totalQuestions: config?.questionCount || 10,
        timeLimit: 30, // Default 30 mins
        difficultyDistribution: { simple: 30, intermediate: 30, expert: 40 },
        subjects: config?.subjectIds || [],
        topics: config?.topicIds || [],
        subtopics: config?.subtopicIds || []
      };
      console.log(`[Selection] Initialized Virtual Blueprint for: ${blueprintOrDomainId}`);
    }

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

      return { questions: staticQuestions, blueprint };
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

    const finalSubjectIds = configSubjectIds || (subjectId ? [subjectId] : blueprint.subjects) || [];
    const finalTopicIds = configTopicIds || legacyTopicIds || blueprint.topics || [];
    const finalSubtopicIds = subtopicIds.length > 0 ? subtopicIds : (blueprint.subtopics || []);

    if (!domainId) {
       throw new Error('Selection criteria (Domain, Subject, Topic or Subtopic) required to compose an exam.');
    }

    const requestedTotal = questionCount || blueprint?.totalQuestions || 10;
    const difficultyPref = difficulty || 'mixed';

    const selectedTopicParents: string[] = finalSubtopicIds.length > 0 
        ? (await db.select({ topicId: subtopics.topicId })
                  .from(subtopics)
                  .where(inArray(subtopics.id, finalSubtopicIds))
          ).map(r => r.topicId)
        : [];
    
    const actualTopicIds = finalTopicIds.filter((id: string) => !selectedTopicParents.includes(id));
    
    const selectedSubjectParents: string[] = finalTopicIds.length > 0 
        ? (await db.select({ subjectId: topics.subjectId })
                  .from(topics)
                  .where(inArray(topics.id, finalTopicIds))
          ).map(r => r.subjectId)
        : [];
    
    const actualSubjectIds = finalSubjectIds.filter((id: string) => !selectedSubjectParents.includes(id));

    const selectedQuestions: any[] = [];
    
    const fetchFromPool = async (diffs: string[], count: number, excludeIds: string[]) => {
      const subtopicCond = finalSubtopicIds.length > 0 ? inArray(questions.subtopicId, finalSubtopicIds) : null;
      const topicCond = actualTopicIds.length > 0 ? inArray(questions.topicId, actualTopicIds) : null;
      
      let subjectTopicCond = null;
      if (actualSubjectIds.length > 0) {
          const subQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, actualSubjectIds));
          subjectTopicCond = inArray(questions.topicId, subQuery);
      }

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

      const allIds = await db.select({ id: questions.id })
        .from(questions)
        .where(and(
          hierarchyCond,
          inArray(questions.difficulty, diffs as any),
          excludeIds.length > 0 ? notInArray(questions.id, excludeIds) : undefined,
          eq(questions.status, 'active')
        ));

      if (allIds.length === 0) return [];

      const shuffledIds = allIds.map(row => row.id);
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
      }

      const subsetIds = shuffledIds.slice(0, count);

      return await db.query.questions.findMany({
        where: inArray(questions.id, subsetIds)
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

    if (selectedQuestions.length === 0) {
      throw new Error(`No questions found for the selected configuration. Please ensure the selected area has active questions.`);
    }

    return { questions: selectedQuestions, blueprint };
  }
}
