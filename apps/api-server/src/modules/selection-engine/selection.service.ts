import { db, questions, examBlueprints, topics, subtopics, subjects as subjectsTable } from '@quiz/db';
import { eq, inArray, sql, and, or, notInArray, gte, asc } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { cacheService } from '../core/cache.service';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

type Blueprint = InferSelectModel<typeof examBlueprints>;
type Question = InferSelectModel<typeof questions>;

interface SelectionCriteria {
  domainId: string;
  finalSubtopicIds: string[];
  actualTopicIds: string[];
  actualSubjectIds: string[];
  requestedTotal: number;
  difficultyPref: string;
}

interface SelectionConfig {
  subjectId?: string;
  subjectIds?: string[];
  topics?: string[];
  topicIds?: string[];
  subtopicIds?: string[];
  questionCount?: number;
  difficulty?: string;
}

export class SelectionService {
  /**
   * Generates a set of deterministic UUID anchors based on a seed.
   */
  private static generateDeterministicUUIDs(seed: string, count: number): string[] {
    const anchors: string[] = [];
    let currentSeed = seed;
    for (let i = 0; i < count; i++) {
        const hash = crypto.createHash('sha256').update(currentSeed + i).digest('hex');
        const uuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(12, 15)}-a${hash.slice(15, 18)}-${hash.slice(18, 30)}`;
        anchors.push(uuid);
        currentSeed = hash;
    }
    return anchors;
  }

  /**
   * Selection logic: Scalable, deterministic keyset sampling.
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
    const _totalSelectionStart = performance.now();

    // 1. Resolve Blueprint
    const blueprint = await this.resolveBlueprint(userId, blueprintOrDomainId, config);

    // 1.5 STATIC OVERRIDE: If blueprint has fixed questionIds, bypass dynamic selection
    if (blueprint.questionIds && blueprint.questionIds.length > 0) {
      return this.fetchStaticQuestions(blueprint);
    }

    // 2. Resolve Selection Criteria
    const criteria = await this.resolveSelectionCriteria(blueprintOrDomainId!, config || {}, blueprint);

    // 3. Dynamic Selection
    const selectedQuestions = await this.executeDynamicSelection(userId, blueprintOrDomainId, idempotencyKey, criteria, blueprint);

    // Performance logging disabled
    // console.log(`[Selection] Total selection time: ${(performance.now() - _totalSelectionStart).toFixed(2)}ms | Questions: ${selectedQuestions.length}`);

    return { questions: selectedQuestions, blueprint };
  }

  private static async resolveBlueprint(userId: string,  blueprintOrDomainId: string, config?: SelectionConfig): Promise<Blueprint> {
     const blueprintCacheKey = `blueprint:${blueprintOrDomainId}`;
     let blueprint: Blueprint | null = null;

    try {
      blueprint = await cacheService.get(blueprintCacheKey);
    } catch (e) {
      console.warn('[Selection] Cache lookup failed', e);
    }

    if (!blueprint) {
      const blueprintResult = await db.query.examBlueprints.findFirst({
        where: eq(examBlueprints.id, blueprintOrDomainId),
      });
      blueprint = blueprintResult ?? null;

      if (!blueprint) {
        const blueprintResult = await db.query.examBlueprints.findFirst({
          where: sql`${examBlueprints.domains} @> ARRAY[${blueprintOrDomainId}]::uuid[]`,
        });
        blueprint = blueprintResult ?? null;
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
      // Create a transient blueprint
      blueprint = {
        id: 'transient', 
        name: 'Quick Assessment',
        totalQuestions: config?.questionCount ?? 10,
        timeLimit: Math.ceil((config?.questionCount ?? 10) * 1.5),
        domains: [],
        description: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: userId,
        // Simulated loose fields
        ...({
            difficultyDistribution: { simple: 30, intermediate: 30, expert: 40 },
            subjects: config?.subjectIds ?? [],
            topics: config?.topicIds ?? [],
            subtopics: config?.subtopicIds ?? [],
            questionIds: []
        } as Record<string, unknown>)
      } as unknown as Blueprint;
    }
    return blueprint;
  }

  private static async fetchStaticQuestions(blueprint: Blueprint) {
      const staticQuestions = await db.query.questions.findMany({
        where: and(
          inArray(questions.id, blueprint.questionIds as string[]),
          eq(questions.status, 'active')
        )
      });

      if (staticQuestions.length === 0) {
        throw new Error('This static blueprint refers to questions that no longer exist or are inactive.');
      }

      return { questions: staticQuestions, blueprint };
  }

  private static async resolveSelectionCriteria(domainId: string, config: SelectionConfig, blueprint: Blueprint): Promise<SelectionCriteria> {
    if (!domainId) {
       throw new Error('Selection criteria (Domain, Subject, Topic or Subtopic) required to compose an exam.');
    }

    const { 
      subjectId, 
      subjectIds: configSubjectIds,
      topics: legacyTopicIds, 
      topicIds: configTopicIds,
      subtopicIds = [],
      questionCount,
      difficulty 
    } = config ?? {};

    const finalSubjectIds = configSubjectIds ?? (subjectId !== undefined ? [subjectId] : blueprint.subjects) ?? [];
    const finalTopicIds = configTopicIds ?? legacyTopicIds ?? blueprint.topics ?? [];
    const finalSubtopicIds = subtopicIds.length > 0 ? subtopicIds : (blueprint.subtopics ?? []);
    
    // Resolve Exclusions (Parents of selected children should not be blindly included to avoid double dipping or broad scope)
    // Actually, in the original logic, we filtered out parents if specific children were selected.
    
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

    return {
        domainId,
        finalSubtopicIds,
        actualTopicIds,
        actualSubjectIds,
        requestedTotal: questionCount ?? blueprint.totalQuestions ?? 10,
        difficultyPref: difficulty ?? 'mixed'
    };
  }

  private static async executeDynamicSelection(
    userId: string, 
    domainId: string,
    idempotencyKey: string,
    criteria: SelectionCriteria, 
    _blueprint: Blueprint
  ): Promise<Question[]> {
      const { finalSubtopicIds, actualTopicIds, actualSubjectIds, requestedTotal, difficultyPref } = criteria;
      const selectedQuestions: Question[] = [];
      const selectedIds = new Set<string>();

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
            subtopicCond ?? undefined, 
            topicCond ?? undefined, 
            subjectTopicCond ?? undefined, 
            domainCond ?? undefined
          ),
          inArray(questions.difficulty, diffs as ("simple" | "intermediate" | "expert")[]),
          eq(questions.status, 'active')
        );

        // 1. Indexed Count for sizing
        const [{ count: totalInPool }] = await db.select({ count: sql<number>`count(*)` })
          .from(questions)
          .where(baseFilters);

        const _pool_count_ms = performance.now() - poolCountStart;

        if (totalInPool === 0) return [];

        // 2. Deterministic Seeding
        const seedSource = JSON.stringify({
          userId,
          idempotencyKey,
          filters: { diffs, domainId, actualSubjectIds, actualTopicIds, finalSubtopicIds },
          requestedCount: count
        });
        const masterSeed = crypto.createHash('sha256').update(seedSource).digest('hex');

        // 3. Jump-and-Sample Loop
        const _sampleFetchStart = performance.now();
        const anchors = this.generateDeterministicUUIDs(masterSeed, count * 2);
        const candidates: Question[] = [];

        for (const anchor of anchors) {
          if (candidates.length >= count) break;

          const [candidate] = await db.select()
            .from(questions)
            .where(and(baseFilters, gte(questions.id, anchor), notInArray(questions.id, Array.from(selectedIds))))
            .orderBy(asc(questions.id))
            .limit(1);

          if (candidate !== undefined && candidate !== null) {
            candidates.push(candidate);
            selectedIds.add(candidate.id);
          } else {
            // Wrap-around
            const [fallback] = await db.select()
              .from(questions)
              .where(and(baseFilters, notInArray(questions.id, Array.from(selectedIds))))
              .orderBy(asc(questions.id))
              .limit(1);
            
            if (fallback !== undefined && fallback !== null) {
              candidates.push(fallback);
              selectedIds.add(fallback.id);
            }
          }
        }

        // console.log(`[Selection] Pool: ${diffs[0]} | Count: ${totalInPool} | pool_count_ms: ${pool_count_ms.toFixed(2)} | sample_fetch_ms: ${(performance.now() - sampleFetchStart).toFixed(2)}`);
        return candidates;
      };

      if (difficultyPref === 'mixed') {
        const tiers = [
          { key: 'simple', target: Math.floor(requestedTotal * 0.3) },
          { key: 'intermediate', target: Math.floor(requestedTotal * 0.3) },
          { key: 'expert', target: requestedTotal - Math.floor(requestedTotal * 0.3) - Math.floor(requestedTotal * 0.3) },
        ];

        for (const tier of tiers) {
          if (tier.target > 0) {
            const pooled = await fetchFromPool([tier.key], tier.target);
            selectedQuestions.push(...pooled);
          }
        }
      } else {
        const pooled = await fetchFromPool([difficultyPref], requestedTotal);
        selectedQuestions.push(...pooled);
      }

      if (selectedQuestions.length === 0) {
        throw new Error(`No questions found for the selected configuration. Please ensure the selected area has active questions.`);
      }

      return selectedQuestions;
  }
}
