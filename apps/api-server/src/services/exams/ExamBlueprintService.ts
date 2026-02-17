import { db, examBlueprints, questions, subjects,subtopics, topics } from "@quiz/db";
import { and, eq, inArray, or, sql } from "drizzle-orm";

import { logger } from "@/lib/logger";
import { cacheService } from "@/modules/core/cache.service";



/**
 * Enterprise Exam Blueprint Generation Service
 * Follows strict rules defined in: docs/execution/EXAM_BLUEPRINT_GENERATION.md
 */

interface BlueprintConfiguration {
  domainId: string;

  subjectIds?: string[];
  topicIds?: string[];
  subtopicIds?: string[];
  questionCount: number;
  difficultyPreference: 'mixed' | 'simple' | 'intermediate' | 'expert';
}

interface DifficultyDistribution {
  simple: number;
  intermediate: number;
  expert: number;
}

export class ExamBlueprintService {
  /**
   * Generates a new exam blueprint based on the provided configuration.
   * Performs resolution, fetching, randomization, and persistence.
   */
  async generateBlueprint(config: BlueprintConfiguration): Promise<string> {
    const { domainId, subjectIds, topicIds, subtopicIds, questionCount, difficultyPreference } = config;


    // 1. Calculate Distribution based on Preference
    const distribution = this.calculateDistribution(questionCount, difficultyPreference);

    // 2. Fetch Eligible Questions by Bucket
    const simpleQuestions = await this.fetchQuestions(distribution.simple, 'simple', domainId, subjectIds, topicIds, subtopicIds);
    const intermediateQuestions = await this.fetchQuestions(distribution.intermediate, 'intermediate', domainId, subjectIds, topicIds, subtopicIds);
    const expertQuestions = await this.fetchQuestions(distribution.expert, 'expert', domainId, subjectIds, topicIds, subtopicIds);

    // 3. Combine Fragments (Elastic Pool Logic)
    // If a bucket has fewer questions than requested, we use what's available.
    // This supports the "Maximum X questions" requirement from the UI.
    const allQuestionIds = [
      ...simpleQuestions.map(q => q.id),
      ...intermediateQuestions.map(q => q.id),
      ...expertQuestions.map(q => q.id)
    ];

    if (allQuestionIds.length === 0) {
      throw new Error(`Zero questions found for the selected criteria.`);
    }

    const actualTotal = allQuestionIds.length;

    // 4. Combine IDs
    const timestamp = new Date().toISOString();
    const name = `Enterprise Generated Exam - ${timestamp}`;

    const [blueprint] = await db.insert(examBlueprints).values({
      name: name,
      description: `Dynamically generated enterprise exam (${questionCount} Qs, ${difficultyPreference}).`,
      domains: [domainId],

      subtopics: subtopicIds || [],
      difficultyDistribution: {
        simple: simpleQuestions.length,
        intermediate: intermediateQuestions.length,
        expert: expertQuestions.length
      },
      totalQuestions: actualTotal,
    }).returning();

    return blueprint.id;
  }

  /**
   * Calculates distribution based on preference.
   * Mixed: 30/30/40 split.
   * Specific: 100% to selected tier.
   */
  private calculateDistribution(total: number, preference: 'mixed' | 'simple' | 'intermediate' | 'expert'): DifficultyDistribution {
    if (preference === 'mixed') {
      const simple = Math.floor(total * 0.30);
      const intermediate = Math.floor(total * 0.30);
      const expert = total - (simple + intermediate); // Absorbs remainder
      return { simple, intermediate, expert };
    }

    // 100% Specific
    return {
      simple: preference === 'simple' ? total : 0,
      intermediate: preference === 'intermediate' ? total : 0,
      expert: preference === 'expert' ? total : 0,
    };
  }

  /**
   * Fetches random questions matching criteria.
   * Uses hierarchical resolution with "Deepest Selection Wins" logic.
   */
  private async fetchQuestions(
    count: number, 
    difficulty: 'simple' | 'intermediate' | 'expert',
    domainId: string,

    subjectIds: string[] = [],
    topicIds: string[] = [],
    subtopicIds: string[] = []
  ): Promise<{ id: string }[]> {
    if (count === 0) return [];

    // 1. Resolve Effective Selections
    const topicParentsOfSubtopics = subtopicIds.length > 0 
        ? (await db.select({ topicId: subtopics.topicId })
                  .from(subtopics)
                  .where(inArray(subtopics.id, subtopicIds))
          ).map(r => r.topicId)
        : [];
    
    const actualTopicIds = topicIds.filter(id => !topicParentsOfSubtopics.includes(id));
    
    const subjectParentsOfTopics = topicIds.length > 0 
        ? (await db.select({ subjectId: topics.subjectId })
                  .from(topics)
                  .where(inArray(topics.id, topicIds))
          ).map(r => r.subjectId)
        : [];
    
    const actualSubjectIds = subjectIds.filter(id => !subjectParentsOfTopics.includes(id));

    // 2. Build Query Conditions
    const subtopicCond = subtopicIds.length > 0 ? inArray(questions.subtopicId, subtopicIds) : null;
    const topicCond = actualTopicIds.length > 0 ? inArray(questions.topicId, actualTopicIds) : null;
    
    let subjectTopicCond = null;
    if (actualSubjectIds.length > 0) {
        const subQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, actualSubjectIds));
        subjectTopicCond = inArray(questions.topicId, subQuery);
    }

    let domainCond = null;
    if (!subtopicCond && !topicCond && !subjectTopicCond) {
        const subjectsSubQuery = db.select({ id: subjects.id }).from(subjects).where(eq(subjects.domainId, domainId));
        const topicsSubQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, subjectsSubQuery));
        domainCond = inArray(questions.topicId, topicsSubQuery);
    }

    const hierarchyCond = or(
        subtopicCond || undefined, 
        topicCond || undefined, 
        subjectTopicCond || undefined, 
        domainCond || undefined
    );

    // 3. Fetch randomized using RT-001 ID Sampling
    // STEP 1: Fetch Only IDs (Scalable)
    const allIds = await db.select({ id: questions.id })
      .from(questions)
      .where(and(
          hierarchyCond,
          eq(questions.status, 'active'),
          eq(questions.difficulty, difficulty)
      ));

    if (allIds.length === 0) return [];

    // STEP 2: In-memory Shuffle (Fisher-Yates)
    const shuffledIds = allIds.map(row => row.id);
    for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }

    // STEP 3: Take subset
    return shuffledIds.slice(0, count).map(id => ({ id }));
  }

  /**
   * Fetches available question counts per difficulty bucket for given filters.
   */
  async getAvailableCounts(filters: {
    domainId: string;
    subjectIds?: string[];
    topicIds?: string[];
    subtopicIds?: string[];
  }): Promise<{ simple: number; intermediate: number; expert: number; total: number; isReady: boolean }> {
    const cacheKey = cacheService.generateKey('blueprint-counts', filters);

    try {
      const cached = await cacheService.get<{ simple: number; intermediate: number; expert: number; total: number; isReady: boolean }>(cacheKey);
      if (cached) return cached;
    } catch (e) {
      logger.warn({ err: e }, '[Blueprint] Cache lookup failed, falling back to DB');
    }

    const { domainId, subjectIds, topicIds, subtopicIds } = filters;


    const counts = {
      simple: 0,
      intermediate: 0,
      expert: 0,
      total: 0,
      isReady: false
    };

    const difficulties: ('simple' | 'intermediate' | 'expert')[] = ['simple', 'intermediate', 'expert'];

    for (const diff of difficulties) {
      counts[diff] = await this.countQuestions(diff, domainId, subjectIds, topicIds, subtopicIds);
      counts.total += counts[diff];
    }

    // Enterprise Readiness Rule: 4 Simple, 4 Intermediate, 5 Expert
    counts.isReady = counts.simple >= 4 && counts.intermediate >= 4 && counts.expert >= 5;

    try {
      await cacheService.set(cacheKey, counts, 1000 * 60 * 5); // 5 minute TTL
    } catch (e) {
      logger.warn({ err: e }, '[Blueprint] Cache storage failed');
    }

    return counts;
  }


  private async countQuestions(
    difficulty: 'simple' | 'intermediate' | 'expert',
    domainId: string,
    subjectIds: string[] = [],
    topicIds: string[] = [],
    subtopicIds: string[] = []
  ) {
    const topicParentsOfSubtopics = (subtopicIds?.length || 0) > 0 
        ? (await db.select({ topicId: subtopics.topicId })
                  .from(subtopics)
                  .where(inArray(subtopics.id, subtopicIds!))
          ).map(r => r.topicId)
        : [];
    
    const actualTopicIds = (topicIds?.length || 0) > 0 
        ? topicIds!.filter(id => !topicParentsOfSubtopics.includes(id))
        : [];
    
    const subjectParentsOfTopics = actualTopicIds.length > 0 
        ? (await db.select({ subjectId: topics.subjectId })
                  .from(topics)
                  .where(inArray(topics.id, actualTopicIds))
          ).map(r => r.subjectId)
        : [];
    
    const actualSubjectIds = (subjectIds?.length || 0) > 0
        ? subjectIds!.filter(id => !subjectParentsOfTopics.includes(id))
        : [];

    const subtopicCond = (subtopicIds?.length || 0) > 0 ? inArray(questions.subtopicId, subtopicIds!) : null;
    const topicCond = actualTopicIds.length > 0 ? inArray(questions.topicId, actualTopicIds) : null;
    
    let subjectTopicCond = null;
    if (actualSubjectIds.length > 0) {
        const subQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, actualSubjectIds));
        subjectTopicCond = inArray(questions.topicId, subQuery);
    }

    let domainCond = null;
    if (!subtopicCond && !topicCond && !subjectTopicCond) {
        const subjectsSubQuery = db.select({ id: subjects.id }).from(subjects).where(eq(subjects.domainId, domainId));
        const topicsSubQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, subjectsSubQuery));
        domainCond = inArray(questions.topicId, topicsSubQuery);
    }

    const hierarchyCond = or(
        subtopicCond || undefined, 
        topicCond || undefined, 
        subjectTopicCond || undefined, 
        domainCond || undefined
    );

    const [res] = await db.select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(and(
          hierarchyCond,
          eq(questions.status, 'active'),
          eq(questions.difficulty, difficulty)
      ));
    
    return Number(res.count) || 0;
  }
}
