import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@quiz/db';
import { SelectionService } from '../selection.service';
import { cacheService } from '@/modules/core/cache.service';
import { container } from '../../core/container';

vi.mock('@/modules/core/cache.service');
vi.mock('@/lib/logger', () => {
  const mock: any = {};
  mock.child = vi.fn(() => mock);
  mock.debug = vi.fn();
  mock.info = vi.fn();
  mock.warn = vi.fn();
  mock.error = vi.fn();
  return { logger: mock };
});

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
      select: vi.fn(),
      query: {
          examBlueprints: { findFirst: vi.fn() },
          questions: { findMany: vi.fn() }
      }
  },
  examBlueprints: { tableName: 'exam_blueprints', id: 'id', domains: 'domains' },
  questions: { tableName: 'questions', id: 'id', status: 'active', difficulty: 'difficulty', topicId: 'topic_id', subtopicId: 'subtopic_id' },
  topics: { tableName: 'topics', id: 'id', subjectId: 'subject_id' },
  subtopics: { tableName: 'subtopics', id: 'id', topicId: 'topic_id' },
  subjects: { tableName: 'subjects', id: 'id', domainId: 'domain_id' }
}));

describe('SelectionService (Branch Coverage)', () => {
  const mockBlueprint = {
    id: 'bp1',
    name: 'Blueprint 1',
    createdAt: new Date(),
    description: 'Test description',
    domains: ['d1'],
    subjects: ['s1'],
    topics: ['t1'],
    subtopics: ['st1'],
    questionIds: [],
    totalQuestions: 10,
    timeLimit: 60,
    difficultyDistribution: {},
  };

  const mkQ = (id = 'q1') => ({
    id,
    difficulty: 'simple',
    status: 'active',
    topicId: 't1',
    subtopicId: 'st1',
  });

  const mockQueryBuilder = (result: any = []) => {
    const mock: any = {
      from: vi.fn().mockImplementation(() => mock),
      where: vi.fn().mockImplementation(() => mock),
      orderBy: vi.fn().mockImplementation(() => mock),
      limit: vi.fn().mockImplementation(() => mock),
      then: (resolve: any) => Promise.resolve(result).then(resolve),
      catch: (reject: any) => Promise.reject(new Error('Mock Error')).catch(reject),
    };
    return mock;
  };

  let selectQueue: any[] = [];
  const qb = (result: any) => mockQueryBuilder(result);

  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
    container.register(SelectionService, new SelectionService(db as any, cacheService as any));
    
    vi.mocked(cacheService.get).mockResolvedValue(null);
    vi.mocked(cacheService.set).mockResolvedValue(undefined as any);
    
    selectQueue = [];
    vi.mocked(db.select).mockImplementation(() => {
        const next = selectQueue.shift();
        if (next !== undefined) return next;
        return qb([{ count: 0 }]);
    });
  });

  // ─── composeExam ─────────────────────────────────────────────────
  describe('composeExam', () => {
    it('bypasses calculation for static blueprints', async () => {
       const staticBp = { ...mockBlueprint, questionIds: ['q1', 'q2'] };
       vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(staticBp as any);
       vi.mocked(db.query.questions.findMany).mockResolvedValue([mkQ('q1'), mkQ('q2')] as any);

       const service = container.get(SelectionService);
       const result = await service.composeExam('u1', 'bp1', 'key1');
       expect(result.questions).toHaveLength(2);
    });

    it('throws if static blueprint refers to non-existent questions', async () => {
        const staticBp = { ...mockBlueprint, questionIds: ['ghost'] };
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(staticBp as any);
        vi.mocked(db.query.questions.findMany).mockResolvedValue([] as any);

        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1')).rejects.toThrow('static blueprint');
    });

    it('handles non-Error objects thrown during execution (L130)', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockImplementation(() => {
            throw "String error";
        });

        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1')).rejects.toBe("String error");
    });
  });

  // ─── resolveBlueprint ────────────────────────────────────────────
  describe('resolveBlueprint', () => {
    it('uses cached blueprint', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(mockBlueprint as any);
      const service = container.get(SelectionService);
      const result = await (service as any).resolveBlueprint('u1', 'bp1', {});
      expect(result.id).toBe('bp1');
    });

    it('creates transient blueprint if not in DB', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(undefined);
        const service = container.get(SelectionService);
        const result = await (service as any).resolveBlueprint('u1', 'none', { questionCount: 5 });
        expect(result.id).toBe('transient');
    });

    it('logs warning but continues if cache.get fails with string (L146)', async () => {
        vi.mocked(cacheService.get).mockImplementation(() => { throw "Cache Get Error"; });
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        const service = container.get(SelectionService);
        const result = await (service as any).resolveBlueprint('u1', 'bp1', {});
        expect(result.id).toBe('bp1');
    });

    it('logs warning but continues if cache.set fails with string (L169)', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        vi.mocked(cacheService.set).mockImplementation(() => { throw "Cache Set Error"; });
        const service = container.get(SelectionService);
        const result = await (service as any).resolveBlueprint('u1', 'bp1', {});
        expect(result.id).toBe('bp1');
    });
  });

  // ─── resolveSelectionCriteria ────────────────────────────────────
  // 
  // Call sequence in resolveSelectionCriteria:
  //   1. IF finalSubtopicIds.length > 0 → db.select({topicId})  (selectedTopicParents)
  //   2. IF finalTopicIds.length > 0    → db.select({subjectId}) (selectedSubjectParents)
  //
  // Important: actualSubjectIds = finalSubjectIds - selectedSubjectParents
  //            actualTopicIds   = finalTopicIds   - selectedTopicParents
  //
  describe('resolveSelectionCriteria', () => {
    it('throws if domainId is missing', async () => {
        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', '', 'key1')).rejects.toThrow('Selection criteria');
    });

    it('handles subjectId (singular) config', async () => {
       // Blueprint has topics=['t1'], so selectedSubjectParents lookup will fire
       // Return [] so s1 is NOT filtered out
       selectQueue = [
         qb([]),  // selectedSubjectParents (topics=['t1'] → parent lookup returns [])
       ];
       const c = await SelectionService.resolveSelectionCriteria('d1', { subjectId: 's1' }, { ...mockBlueprint, subtopics: [] } as any);
       expect(c.actualSubjectIds).toContain('s1');
    });

    it('handles subjectIds (plural) config', async () => {
       selectQueue = [
         qb([]), // selectedSubjectParents
       ];
       const c = await SelectionService.resolveSelectionCriteria('d1', { subjectIds: ['s3'] }, { ...mockBlueprint, subtopics: [] } as any);
       expect(c.actualSubjectIds).toContain('s3');
    });

    it('handles legacy topics config', async () => {
        selectQueue = [
          qb([]),  // selectedSubjectParents
        ];
        const c = await SelectionService.resolveSelectionCriteria('d1', { topics: ['t2'] }, { ...mockBlueprint, subtopics: [] } as any);
        expect(c.actualTopicIds).toContain('t2');
    });

    it('autofills difficulty=simple for topic depth', async () => {
      // Blueprint subtopics=[] so no subtopic parent lookup
      // Blueprint topics=['t1'] so subject parent lookup fires
      selectQueue = [
        qb([]),  // selectedSubjectParents
      ];
      const c = await SelectionService.resolveSelectionCriteria('d1', { topicIds: ['t1'] }, { ...mockBlueprint, subtopics: [] } as any);
      expect(c.difficultyPref).toBe('simple');
      expect(c.requestedTotal).toBe(10);
    });

    it('autofills difficulty=mixed for subtopic depth', async () => {
      // subtopicIds=['st1'] → topicParent lookup fires
      // blueprint topics=['t1'] → subjectParent lookup fires
      selectQueue = [
        qb([{ topicId: 't1' }]),  // selectedTopicParents
        qb([]),                    // selectedSubjectParents
      ];
      const c = await SelectionService.resolveSelectionCriteria('d1', { subtopicIds: ['st1'] }, mockBlueprint as any);
      expect(c.difficultyPref).toBe('mixed');
    });

    it('keeps provided difficulty when only count is missing', async () => {
      selectQueue = [
        qb([]),  // selectedSubjectParents
      ];
      const c = await SelectionService.resolveSelectionCriteria('d1', { topicIds: ['t1'], difficulty: 'expert' }, { ...mockBlueprint, subtopics: [] } as any);
      expect(c.requestedTotal).toBe(10);
      expect(c.difficultyPref).toBe('expert');
    });
    it('keeps provided count when only difficulty is missing', async () => {
      selectQueue = [
        qb([]),  // selectedSubjectParents
      ];
      const c = await SelectionService.resolveSelectionCriteria('d1', { topicIds: ['t1'], questionCount: 7 }, { ...mockBlueprint, subtopics: [] } as any);
      expect(c.requestedTotal).toBe(7);
      expect(c.difficultyPref).toBe('simple');
    });

    it('filters out parent topics when subtopics provided', async () => {
        selectQueue = [
            qb([{ topicId: 't1' }]),  // selectedTopicParents → t1 is parent of st1
            qb([]),                    // selectedSubjectParents
        ];
        const c = await SelectionService.resolveSelectionCriteria('d1', { subtopicIds: ['st1'], topicIds: ['t1'] }, mockBlueprint as any);
        expect(c.actualTopicIds).not.toContain('t1');
    });

    it('falls back to blueprint subjects/topics when config is empty', async () => {
        // No subtopics, no topics in config/blueprint → no parent lookups fire
        const c = await SelectionService.resolveSelectionCriteria('d1', {}, { ...mockBlueprint, subtopics: [], topics: [] } as any);
        expect(c.actualSubjectIds).toEqual(['s1']);
    });
  });

  // ─── executeDynamicSelection ─────────────────────────────────────
  //
  // Call sequence per fetchFromPool invocation:
  //   1. db.select({count}) → count query        (consumes 1 queue item)
  //   2. db.select() → anchor candidate           (consumes 1 per anchor, up to count*2)
  //      - if anchor miss → db.select() fallback  (consumes 1 more)
  //
  // For single difficulty:
  //   resolveSelectionCriteria lookups + 1 fetchFromPool call
  //
  // For mixed difficulty (requestedTotal=10):
  //   resolveSelectionCriteria lookups + 3 fetchFromPool calls
  //   tiers: simple=floor(10*0.3)=3, intermediate=3, expert=10-3-3=4
  //
  describe('executeDynamicSelection', () => {

    it('single difficulty happy path', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        // resolveSelectionCriteria: subtopics=['st1'] → topicParent lookup, topics=['t1'] → subjectParent lookup
        selectQueue = [
            qb([{ topicId: 't1' }]),  // selectedTopicParents
            qb([]),                    // selectedSubjectParents
            qb([]),                    // subjectTopicCond subquery builder (actualSubjectIds = ['s1'])
            // fetchFromPool (difficulty='simple', count=1):
            qb([{ count: 5 }]),       // count query
            qb([mkQ('q1')]),          // anchor hit → done
        ];

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
        expect(result.questions).toHaveLength(1);
    });

    it('triggers wrap-around logic in sampling', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        selectQueue = [
            qb([{ topicId: 't1' }]),  // selectedTopicParents
            qb([]),                    // selectedSubjectParents
            qb([]),                    // subjectTopicCond subquery builder (actualSubjectIds = ['s1'])
            // fetchFromPool:
            qb([{ count: 1 }]),       // count query
            qb([]),                    // anchor MISS → triggers wrap-around
            qb([mkQ('q1')]),          // wrap-around fallback hit
        ];

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
        expect(result.questions).toHaveLength(1);
    });

    it('handles wrap-around fallback returning nothing', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        selectQueue = [
            qb([{ topicId: 't1' }]),  // selectedTopicParents
            qb([]),                    // selectedSubjectParents
            qb([]),                    // subjectTopicCond subquery builder (actualSubjectIds = ['s1'])
            // fetchFromPool:
            qb([{ count: 1 }]),       // count query
            qb([]),                    // anchor 1 MISS → triggers wrap-around
            qb([]),                    // wrap-around 1 fallback MISS
            qb([]),                    // anchor 2 MISS
            qb([]),                    // wrap-around 2 fallback MISS
        ];

        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 })).rejects.toThrow('No questions found');
    });

    it('uses subjectTopicCond when actualSubjectIds is populated', async () => {
        // Use a blueprint with no subtopics/topics so those conds are null, but actualSubjectIds is set
        const bpSubjectOnly = { ...mockBlueprint, subtopics: [], topics: [] };
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(bpSubjectOnly as any);
        // No subtopics → no parent lookup. No topics → no parent lookup.
        selectQueue = [
            // fetchFromPool:
            qb([{ count: 1 }]),
            qb([mkQ('q1')]),
        ];

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', {
          subjectIds: ['s1'], difficulty: 'simple', questionCount: 1,
        });
        expect(result.questions.length).toBeGreaterThan(0);
    });

    it('uses domainCond fallback filter', async () => {
        // Blueprint with no scope → all conds null → domainCond fires
        const bp0 = { ...mockBlueprint, subjects: [], topics: [], subtopics: [] };
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(bp0 as any);
        // No parent lookups needed
        selectQueue = [
            qb([]),               // domainCond subjects subquery builder
            qb([]),               // domainCond topics subquery builder
            qb([{ count: 1 }]),   // count
            qb([mkQ('q1')]),      // candidate
        ];

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
        expect(result.questions.length).toBeGreaterThan(0);
    });

    it('handles "mixed" difficulty tier loop', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);

        // resolveSelectionCriteria parent lookups:
        selectQueue = [
            qb([{ topicId: 't1' }]),  // selectedTopicParents
            qb([]),                    // selectedSubjectParents
            qb([]),                    // subjectTopicCond subquery builder (actualSubjectIds = ['s1'])
        ];

        // For requestedTotal=10, mixed splits: simple=3, intermediate=3, expert=4
        // Tier simple (target=3): count + 3 anchor hits
        selectQueue.push(qb([{ count: 10 }]));
        selectQueue.push(qb([mkQ('q1')]));
        selectQueue.push(qb([mkQ('q2')]));
        selectQueue.push(qb([mkQ('q3')]));
        // Tier intermediate (target=3): count + 3 anchor hits
        selectQueue.push(qb([{ count: 10 }]));
        selectQueue.push(qb([mkQ('q4')]));
        selectQueue.push(qb([mkQ('q5')]));
        selectQueue.push(qb([mkQ('q6')]));
        // Tier expert (target=4): count + 4 anchor hits
        selectQueue.push(qb([{ count: 10 }]));
        selectQueue.push(qb([mkQ('q7')]));
        selectQueue.push(qb([mkQ('q8')]));
        selectQueue.push(qb([mkQ('q9')]));
        selectQueue.push(qb([mkQ('q10')]));

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'mixed', questionCount: 10 });
        expect(result.questions).toHaveLength(10);
    });

    it('throws error when no questions are found in pool (L399)', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        selectQueue = [
            qb([{ topicId: 't1' }]),  // selectedTopicParents
            qb([]),                    // selectedSubjectParents
            qb([{ count: 0 }]),       // pool empty → returns []
        ];
        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 })).rejects.toThrow('No questions found');
    });

    it('hits empty pool return in fetchFromPool(L335) via mixed path', async () => {
        // Use mixed to hit the for-loop path at L387
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        selectQueue = [
            qb([{ topicId: 't1' }]),
            qb([]),
            // All 3 tiers return count=0
            qb([{ count: 0 }]),
            qb([{ count: 0 }]),
            qb([{ count: 0 }]),
        ];
        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1', { difficulty: 'mixed', questionCount: 10 })).rejects.toThrow('No questions found');
    });
  });
});

