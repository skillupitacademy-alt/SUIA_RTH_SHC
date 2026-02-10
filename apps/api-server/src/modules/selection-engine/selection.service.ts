import { db, questions, examBlueprints, exams, examQuestions, topics, subtopics, subjects as subjectsTable } from '@quiz/db';
import { eq, inArray, sql, and, or, notInArray, gte, asc } from 'drizzle-orm';
import { cacheService } from '../core/cache.service';
import crypto from 'crypto';
import { performance } from 'perf_hooks';


export class SelectionEngine {
  /**
   * Generates a set of deterministic UUID anchors based on a seed.
   * These anchors are used as starting points for keyset pagination.
   */
  private static generateDeterministicUUIDs(seed: string, count: number): string[] {
    const anchors: string[] = [];
    let currentSeed = seed;
    for (let i = 0; i < count; i++) {
        const hash = crypto.createHash('sha256').update(currentSeed + i).digest('hex');
        // Construct a valid-looking UUID string from the hash
        const uuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(12, 15)}-a${hash.slice(15, 18)}-${hash.slice(18, 30)}`;
        anchors.push(uuid);
        currentSeed = hash; // Chain for progression
    }
    return anchors;
  }

  /**
   * Selection logic: Scalable, deterministic keyset sampling.
   * Replaces memory-heavy shuffling with O(log N) indexed jumps.
   */
  static async composeExam(
    userId: string, 
    blueprintOrDomainId: string, 
    idempotencyKey: string,
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
    const totalSelectionStart = performance.now();

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
      blueprint = {
        id: null,
        name: 'Quick Assessment',
        totalQuestions: config?.questionCount || 10,
        timeLimit: Math.ceil((config?.questionCount || 10) * 1.5), // 1.5 mins per question
        difficultyDistribution: { simple: 30, intermediate: 30, expert: 40 },
        subjects: config?.subjectIds || [],
        topics: config?.topicIds || [],
        subtopics: config?.subtopicIds || []
      };
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
    const selectedIds = new Set<string>();
    
    /**
     * Optimized fetchFromPool: USES Jump-and-Sample (O(log N) lookups).
     * No more full ID materialization.
     */
    const fetchFromPool = async (diffs: string[], count: number) => {
      const poolCountStart = performance.now();
      
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

      const baseFilters = and(
        or(
          subtopicCond || undefined, 
          topicCond || undefined, 
          subjectTopicCond || undefined, 
          domainCond || undefined
        ),
        inArray(questions.difficulty, diffs as any),
        eq(questions.status, 'active')
      );

      // 1. Indexed Count for sizing
      const [{ count: totalInPool }] = await db.select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(baseFilters);

      const pool_count_ms = performance.now() - poolCountStart;

      if (totalInPool === 0) return [];

      // 2. Deterministic Seeding (Full Config + Idempotency)
      const seedSource = JSON.stringify({
        userId,
        idempotencyKey,
        filters: { diffs, domainId, actualSubjectIds, actualTopicIds, finalSubtopicIds },
        requestedCount: count
      });
      const masterSeed = crypto.createHash('sha256').update(seedSource).digest('hex');

      // 3. Jump-and-Sample Loop
      const sampleFetchStart = performance.now();
      const anchors = this.generateDeterministicUUIDs(masterSeed, count * 2); // Generate extra for deduplication
      const candidates: any[] = [];

      for (const anchor of anchors) {
        if (candidates.length >= count) break;

        // Surgical Keyset Jump: O(log N)
        const [candidate] = await db.select()
          .from(questions)
          .where(and(baseFilters, gte(questions.id, anchor), notInArray(questions.id, Array.from(selectedIds))))
          .orderBy(asc(questions.id))
          .limit(1);

        if (candidate) {
          candidates.push(candidate);
          selectedIds.add(candidate.id);
        } else {
          // Wrap-around fallback (if anchor is past the end of the pool)
          const [fallback] = await db.select()
            .from(questions)
            .where(and(baseFilters, notInArray(questions.id, Array.from(selectedIds))))
            .orderBy(asc(questions.id))
            .limit(1);
          
          if (fallback) {
            candidates.push(fallback);
            selectedIds.add(fallback.id);
          }
        }
      }

      console.log(`[Selection] Pool: ${diffs[0]} | Count: ${totalInPool} | pool_count_ms: ${pool_count_ms.toFixed(2)} | sample_fetch_ms: ${(performance.now() - sampleFetchStart).toFixed(2)}`);
      return candidates;
    };

    if (difficultyPref === 'mixed') {
      const tiers = [
        { key: 'simple', target: Math.floor(requestedTotal * 0.3) },
        { key: 'intermediate', target: Math.floor(requestedTotal * 0.3) },
        { key: 'expert', target: requestedTotal - Math.floor(requestedTotal * 0.3) - Math.floor(requestedTotal * 0.3) },
      ];

      for (const tier of tiers) {
        if (tier.target <= 0) continue;
        const pooled = await fetchFromPool([tier.key], tier.target);
        selectedQuestions.push(...pooled);
      }
    } else {
      const pooled = await fetchFromPool([difficultyPref], requestedTotal);
      selectedQuestions.push(...pooled);
    }

    if (selectedQuestions.length === 0) {
      throw new Error(`No questions found for the selected configuration. Please ensure the selected area has active questions.`);
    }

    console.log(`[Selection] Total selection time: ${(performance.now() - totalSelectionStart).toFixed(2)}ms | Questions: ${selectedQuestions.length}`);

    return { questions: selectedQuestions, blueprint };
  }
}
