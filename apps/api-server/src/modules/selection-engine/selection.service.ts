import { db, examBlueprints, questions, STANDARD_QUERY_TIMEOUT, subjects as subjectsTable, subtopics, topics, withTimeout as dbWithTimeout } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import crypto from 'crypto';
import type { InferSelectModel } from 'drizzle-orm';
import { and, asc, eq, gte, inArray, notInArray, or, sql } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withSpan } from '@/lib/tracer';
import { cacheService } from '@/modules/core/cache.service';

const withTimeout = dbWithTimeout ?? (async <T>(promise: Promise<T>) => promise);

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
  private log = logger.child({ module: 'selection-engine' });

  constructor(
    private dbInstance = db,
    private cache = cacheService
  ) {}

  private static singleton: SelectionService | null = null;

  private static getInstance() {
    if (this.singleton === null) this.singleton = new SelectionService();
    return this.singleton;
  }

  static composeExam(
    userId: string,
    blueprintOrDomainId: string,
    idempotencyKey: string,
    config?: SelectionConfig
  ) {
    return this.getInstance().composeExam(userId, blueprintOrDomainId, idempotencyKey, config);
  }

  static setInstance(mock: SelectionService) {
    this.singleton = mock;
  }

  // Expose for branch-coverage tests
  static resolveSelectionCriteria(domainId: string, config: SelectionConfig, blueprint: Blueprint) {
    return this.getInstance().resolveSelectionCriteria(domainId, config, blueprint);
  }

  /**
   * Generates a set of deterministic UUID anchors based on a seed.
   */
  private generateDeterministicUUIDs(seed: string, count: number): string[] {
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
  async composeExam(
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
    return withSpan('SelectionService.composeExam', async (span) => {
      const start = Date.now();
      span.setAttribute('userId', userId);
      span.setAttribute('blueprintOrDomainId', blueprintOrDomainId);

      try {
        // 1. Resolve Blueprint
        const blueprint = await this.resolveBlueprint(userId, blueprintOrDomainId, config);

        // 1.5 STATIC OVERRIDE: If blueprint has fixed questionIds, bypass dynamic selection
        if (blueprint.questionIds && blueprint.questionIds.length > 0) {
          const result = await this.fetchStaticQuestions(blueprint);
          recordCounter(METRICS.CORE.SELECTION + '.success', 1, { type: 'static' });
          recordTimer(METRICS.CORE.SELECTION + '.duration', Date.now() - start);
          return result;
        }

        // 2. Resolve Selection Criteria
        const criteria = await this.resolveSelectionCriteria(blueprintOrDomainId!, config || {}, blueprint);

        // 3. Dynamic Selection
        const selectedQuestions = await this.executeDynamicSelection(userId, blueprintOrDomainId, idempotencyKey, criteria, blueprint);

        const durationMs = Date.now() - start;
        recordCounter(METRICS.CORE.SELECTION + '.success', 1, { type: 'dynamic' });
        recordTimer(METRICS.CORE.SELECTION + '.duration', durationMs);

        return { questions: selectedQuestions, blueprint };
      } catch (error: unknown) {
        const durationMs = Date.now() - start;
        recordCounter(METRICS.CORE.SELECTION + '.failure', 1, { 
          error: error instanceof Error ? error.message : 'unknown' 
        });
        recordTimer(METRICS.CORE.SELECTION + '.duration', durationMs);
        throw error;
      }
    });
  }

  private async resolveBlueprint(userId: string,  blueprintOrDomainId: string, config?: SelectionConfig): Promise<Blueprint> {
     const blueprintCacheKey = `blueprint:${blueprintOrDomainId}`;
     let blueprint: Blueprint | null = null;

    try {
      blueprint = await this.cache.get(blueprintCacheKey);
    } catch (e) {
      this.log.warn(
        { error: e instanceof Error ? e.message : 'unknown error' },
        'Cache lookup failed when resolving blueprint',
      );
    }

    if (!blueprint) {
      const blueprintResult = await withTimeout(
        this.dbInstance.query.examBlueprints.findFirst({
          where: eq(examBlueprints.id, blueprintOrDomainId),
        }),
        STANDARD_QUERY_TIMEOUT,
        'SelectionService.resolveBlueprint.byId'
      );
      blueprint = blueprintResult ?? null;

      if (!blueprint) {
        const blueprintResult = await withTimeout(
          this.dbInstance.query.examBlueprints.findFirst({
            where: sql`${examBlueprints.domains} @> ARRAY[${blueprintOrDomainId}]::uuid[]`,
          }),
          STANDARD_QUERY_TIMEOUT,
          'SelectionService.resolveBlueprint.byDomain'
        );
        blueprint = blueprintResult ?? null;
      }

      if (blueprint) {
        try {
          await this.cache.set(blueprintCacheKey, blueprint, 1000 * 60 * 10);
        } catch (e) {
          this.log.warn(
            { error: e instanceof Error ? e.message : 'unknown error' },
            'Cache storage failed when caching blueprint',
          );
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

  private async fetchStaticQuestions(blueprint: Blueprint) {
      const staticQuestions = await withTimeout(
        this.dbInstance.query.questions.findMany({
          where: and(
            inArray(questions.id, blueprint.questionIds as string[]),
            eq(questions.status, 'active')
          )
        }),
        STANDARD_QUERY_TIMEOUT,
        'SelectionService.fetchStaticQuestions'
      );

      if (staticQuestions.length === 0) {
        throw new Error('This static blueprint refers to questions that no longer exist or are inactive.');
      }

      return { questions: staticQuestions, blueprint };
  }

  private async resolveSelectionCriteria(domainId: string, config: SelectionConfig, blueprint: Blueprint): Promise<SelectionCriteria> {
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

    // Task 59: Apply depth-based configuration rules
    // IF till topics -> Difficulty is Simple, 10 Questions
    // If till Sub topics -> Difficulty is Mixed, 10 Questions
    let autoDifficulty = difficulty;
    let autoCount = questionCount;

    const hasDifficulty = autoDifficulty !== undefined && autoDifficulty !== null && autoDifficulty !== '';
    const hasCount = autoCount !== undefined && autoCount !== null;

    if (!hasDifficulty || !hasCount) {
        const hasSubtopicDepth = finalSubtopicIds.length > 0;
        const hasTopicDepth = finalTopicIds.length > 0;
        if (hasSubtopicDepth || hasTopicDepth) {
            if (!hasDifficulty) autoDifficulty = hasSubtopicDepth ? 'mixed' : 'simple';
            if (!hasCount) autoCount = 10;
        }
    }

    // Final fallback to blueprint/global defaults
    autoDifficulty = autoDifficulty ?? 'mixed';
    autoCount = autoCount ?? blueprint.totalQuestions ?? 10;
    
    // Resolve Exclusions (Parents of selected children should not be blindly included to avoid double dipping or broad scope)
    const selectedTopicParents: string[] = finalSubtopicIds.length > 0 
        ? (await withTimeout(
                  this.dbInstance.select({ topicId: subtopics.topicId })
                  .from(subtopics)
                  .where(inArray(subtopics.id, finalSubtopicIds)),
                  STANDARD_QUERY_TIMEOUT,
                  'SelectionService.resolveCriteria.topicParents'
          )).map(r => r.topicId)
        : [];
    
    const actualTopicIds = finalTopicIds.filter((id: string) => !selectedTopicParents.includes(id));
    
    const selectedSubjectParents: string[] = finalTopicIds.length > 0 
        ? (await withTimeout(
                  this.dbInstance.select({ subjectId: topics.subjectId })
                  .from(topics)
                  .where(inArray(topics.id, finalTopicIds)),
                  STANDARD_QUERY_TIMEOUT,
                  'SelectionService.resolveCriteria.subjectParents'
          )).map(r => r.subjectId)
        : [];
    
    const actualSubjectIds = finalSubjectIds.filter((id: string) => !selectedSubjectParents.includes(id));

    return {
        domainId,
        finalSubtopicIds,
        actualTopicIds,
        actualSubjectIds,
        requestedTotal: autoCount,
        difficultyPref: autoDifficulty
    };
  }

  private async executeDynamicSelection(
    userId: string, 
    domainId: string,
    idempotencyKey: string,
    criteria: SelectionCriteria, 
    _blueprint: Blueprint
  ): Promise<Question[]> {
    return withSpan('SelectionService.executeDynamicSelection', async (span) => {
      span.setAttribute('domainId', domainId);
      span.setAttribute('userId', userId);

      const { finalSubtopicIds, actualTopicIds, actualSubjectIds, requestedTotal, difficultyPref } = criteria;
      const selectedQuestions: Question[] = [];
      const selectedIds = new Set<string>();

      const fetchFromPool = async (diffs: string[], count: number) => {
        const subtopicCond = finalSubtopicIds.length > 0 ? inArray(questions.subtopicId, finalSubtopicIds) : null;
        const topicCond = actualTopicIds.length > 0 ? inArray(questions.topicId, actualTopicIds) : null;
        
        let subjectTopicCond = null;
        if (actualSubjectIds.length > 0) {
            const subQuery = this.dbInstance.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, actualSubjectIds));
            subjectTopicCond = inArray(questions.topicId, subQuery);
        }

        let domainCond = null;
        if (!subtopicCond && !topicCond && !subjectTopicCond) {
            const subjectsSubQuery = this.dbInstance.select({ id: subjectsTable.id }).from(subjectsTable).where(eq(subjectsTable.domainId, domainId));
            const topicsSubQuery = this.dbInstance.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, subjectsSubQuery));
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
        const [{ count: totalInPool }] = await withTimeout(
          this.dbInstance.select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(baseFilters),
          STANDARD_QUERY_TIMEOUT,
          'SelectionService.fetchFromPool.count'
        );

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
        const anchors = this.generateDeterministicUUIDs(masterSeed, count * 2);
        const candidates: Question[] = [];

        for (const anchor of anchors) {
          if (candidates.length >= count) break;

          const [candidate] = await withTimeout(
            this.dbInstance.select()
              .from(questions)
              .where(and(baseFilters, gte(questions.id, anchor), notInArray(questions.id, Array.from(selectedIds))))
              .orderBy(asc(questions.id))
              .limit(1),
            STANDARD_QUERY_TIMEOUT,
            'SelectionService.fetchFromPool.anchor'
          );

          if (candidate !== undefined && candidate !== null) {
            candidates.push(candidate);
            selectedIds.add(candidate.id);
          } else {
            // Wrap-around
            const [fallback] = await withTimeout(
              this.dbInstance.select()
                .from(questions)
                .where(and(baseFilters, notInArray(questions.id, Array.from(selectedIds))))
                .orderBy(asc(questions.id))
                .limit(1),
              STANDARD_QUERY_TIMEOUT,
              'SelectionService.fetchFromPool.fallback'
            );
            
            if (fallback !== undefined && fallback !== null) {
              candidates.push(fallback);
              selectedIds.add(fallback.id);
            }
          }
        }

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
    });
  }
}
