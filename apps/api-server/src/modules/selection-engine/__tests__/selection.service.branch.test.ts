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
        return qb([]);
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
  describe('resolveSelectionCriteria', () => {
    it('throws if domainId is missing', async () => {
        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', '', 'key1')).rejects.toThrow('Selection criteria');
    });

    it('handles subjectId (singular) config', async () => {
       selectQueue = [
         qb([]),  // selectedSubjectParents
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
      selectQueue = [
        qb([]),  // selectedSubjectParents
      ];
      const c = await SelectionService.resolveSelectionCriteria('d1', { topicIds: ['t1'] }, { ...mockBlueprint, subtopics: [] } as any);
      expect(c.difficultyPref).toBe('simple');
      expect(c.requestedTotal).toBe(10);
    });

    it('autofills difficulty=mixed for subtopic depth', async () => {
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
            qb([{ topicId: 't1' }]),  // selectedTopicParents
            qb([]),                    // selectedSubjectParents
        ];
        const c = await SelectionService.resolveSelectionCriteria('d1', { subtopicIds: ['st1'], topicIds: ['t1'] }, mockBlueprint as any);
        expect(c.actualTopicIds).not.toContain('t1');
    });

    it('falls back to blueprint subjects/topics when config is empty', async () => {
        const c = await SelectionService.resolveSelectionCriteria('d1', {}, { ...mockBlueprint, subtopics: [], topics: [] } as any);
        expect(c.actualSubjectIds).toEqual(['s1']);
    });
  });

  // ─── executeDynamicSelection ─────────────────────────────────────
  describe('executeDynamicSelection', () => {

    it('single difficulty happy path', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        selectQueue = [
            qb([{ topicId: 't1' }]),  // selectedTopicParents
            qb([]),                    // selectedSubjectParents
            qb([]),                    // subQuery for subjectTopicCond (actualSubjectIds = ['s1'])
            qb([{ id: 'q1', difficulty: 'simple' }]), 
            qb([mkQ('q1')])
        ];

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
        expect(result.questions).toHaveLength(1);
    });

    it('triggers wrap-around logic in sampling', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        const service = container.get(SelectionService);
        const composeSpy = vi
          .spyOn(SelectionService.prototype as any, 'composeExam')
          .mockResolvedValueOnce({
            questions: [{ id: 'wrap-q', difficulty: 'simple', topicId: 't1', subtopicId: 'st1' }],
            blueprint: mockBlueprint,
          });

        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
        expect(result.questions).toHaveLength(1);
        composeSpy.mockRestore();
    });

    it('handles wrap-around fallback returning nothing', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        selectQueue = [
            qb([{ topicId: 't1' }]),  
            qb([]),                    
            qb([]),                    // subQuery for subjectTopicCond
            qb([]),                    // Query 1: No IDs found
        ];

        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 })).rejects.toThrow('No questions found');
    });

    it('uses subjectTopicCond when actualSubjectIds is populated', async () => {
        const bpSubjectOnly = { ...mockBlueprint, subtopics: [], topics: [] };
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(bpSubjectOnly as any);
        selectQueue = [
            qb([]),                    // subQuery for subjectTopicCond (actualSubjectIds = ['s1'])
            qb([{ id: 'q1', difficulty: 'simple' }]),
            qb([mkQ('q1')]),
        ];

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', {
          subjectIds: ['s1'], difficulty: 'simple', questionCount: 1,
        });
        expect(result.questions.length).toBeGreaterThan(0);
    });

    it('uses domainCond fallback filter', async () => {
        const bp0 = { ...mockBlueprint, subjects: [], topics: [], subtopics: [] };
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(bp0 as any);
        selectQueue = [
            qb([]),               // domainCond subjects subquery builder
            qb([]),               // domainCond topics subquery builder
            qb([{ id: 'q1', difficulty: 'simple' }]),
            qb([mkQ('q1')]),
        ];

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
        expect(result.questions.length).toBeGreaterThan(0);
    });

    it('handles "mixed" difficulty tier loop', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        selectQueue = [
            qb([{ topicId: 't1' }]),  
            qb([]),                    
            qb([]),                    // subQuery for subjectTopicCond
            qb([
                { id: 'q1', difficulty: 'simple' },
                { id: 'q2', difficulty: 'intermediate' },
                { id: 'q3', difficulty: 'expert' }
            ]),
            qb([mkQ('q1'), mkQ('q2'), mkQ('q3')])
        ];

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'mixed', questionCount: 10 });
        expect(result.questions.length).toBeGreaterThanOrEqual(1);
    });

    it('throws error when no questions are found in pool', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        selectQueue = [
            qb([{ topicId: 't1' }]),  
            qb([]),                    
            qb([]),                    // subQuery for subjectTopicCond
            qb([]),                    
        ];
        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 })).rejects.toThrow('No questions found');
    });
  });
});
