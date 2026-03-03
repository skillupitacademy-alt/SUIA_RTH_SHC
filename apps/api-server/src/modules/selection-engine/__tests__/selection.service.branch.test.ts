import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@quiz/db';
import { SelectionService } from '../selection.service';
import { cacheService } from '@/modules/core/cache.service';

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

describe('SelectionService (Branch Coverage)', () => {
  const mockBlueprint = {
    id: 'bp1',
    name: 'Blueprint 1',
    createdAt: new Date(),
    description: 'Test description',
    domains: ['d1'],
    subjects: ['s1'] as string[] | null,
    topics: ['t1'] as string[] | null,
    subtopics: ['st1'] as string[] | null,
    questionIds: [] as string[] | null,
    totalQuestions: 10,
    timeLimit: 60,
    difficultyDistribution: {} as any,
  };

  const mockQuestion = {
    id: 'q1',
    difficulty: 'simple',
    status: 'active',
    topicId: 't1',
    subtopicId: 'st1',
  };

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

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Ensure db properties exist for mocking
    if (!(db as any).query) (db as any).query = {};
    if (!(db.query as any).examBlueprints) (db.query as any).examBlueprints = { findFirst: vi.fn(), findMany: vi.fn() };
    if (!(db.query as any).questions) (db.query as any).questions = { findFirst: vi.fn(), findMany: vi.fn() };
    
    // Setup cache mocks
    vi.mocked(cacheService.get).mockResolvedValue(null);
    vi.mocked(cacheService.set).mockResolvedValue(undefined as any);

    // Default db.select
    (db.select as any) = vi.fn().mockImplementation(() => mockQueryBuilder([]));
  });

  describe('composeExam', () => {
    it('bypasses calculation for static blueprints', async () => {
       const staticBp = { ...mockBlueprint, questionIds: ['q1', 'q2'] };
       vi.spyOn(db.query.examBlueprints, 'findFirst').mockResolvedValue(staticBp as any);
       vi.spyOn(db.query.questions, 'findMany').mockResolvedValue([mockQuestion, { ...mockQuestion, id: 'q2' }] as any);

       const result = await SelectionService.composeExam('u1', 'bp1', 'key1');
       expect(result.questions).toHaveLength(2);
    });

    it('throws if static blueprint refers to non-existent questions', async () => {
        const staticBp = { ...mockBlueprint, questionIds: ['ghost'] };
        vi.spyOn(db.query.examBlueprints, 'findFirst').mockResolvedValue(staticBp as any);
        vi.spyOn(db.query.questions, 'findMany').mockResolvedValue([] as any);

        await expect(SelectionService.composeExam('u1', 'bp1', 'key1')).rejects.toThrow('static blueprint');
    });
  });

  describe('resolveBlueprint', () => {
    it('uses transient blueprint if none found in DB', async () => {
        vi.spyOn(db.query.examBlueprints, 'findFirst').mockResolvedValue(undefined);
        
        (db.select as any)
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([{ count: 1 }])) 
            .mockReturnValueOnce(mockQueryBuilder([mockQuestion]));

        const result = await SelectionService.composeExam('u1', 'none', 'key1', { questionCount: 5, difficulty: 'simple' });
        expect(result.blueprint.id).toBe('transient');
    });

    it('resolves by domains overlap if direct ID lookup fails', async () => {
        vi.spyOn(db.query.examBlueprints, 'findFirst')
            .mockResolvedValueOnce(undefined) 
            .mockResolvedValueOnce(mockBlueprint as any); 

        (db.select as any)
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([{ count: 1 }])) 
            .mockReturnValueOnce(mockQueryBuilder([mockQuestion]));

        const result = await SelectionService.composeExam('u1', 'd1', 'key1', { difficulty: 'simple' });
        expect(result.blueprint.id).toBe('bp1');
    });
  });

  describe('resolveSelectionCriteria', () => {
    it('throws if domainId is missing', async () => {
        await expect(SelectionService.composeExam('u1', '', 'key1')).rejects.toThrow('Selection criteria');
    });

    it('filters out parent topics if children subtopics are specified', async () => {
        vi.spyOn(db.query.examBlueprints, 'findFirst').mockResolvedValue(mockBlueprint as any);
        const selectQueue = [
            mockQueryBuilder([{ topicId: 't1' }]),
            mockQueryBuilder([]),
            mockQueryBuilder([]),
            mockQueryBuilder([{ count: 1 }]),
            mockQueryBuilder([mockQuestion]),
        ];
        (db.select as any) = vi.fn().mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

        const result = await SelectionService.composeExam('u1', 'bp1', 'key1', { subtopicIds: ['st1'], topicIds: ['t1'], difficulty: 'simple', questionCount: 1 });
        expect(result.questions.length).toBeGreaterThan(0);
    });
  });

  describe('executeDynamicSelection', () => {
    it('uses subjectTopicCond when actualSubjectIds is populated', async () => {
        vi.spyOn(db.query.examBlueprints, 'findFirst').mockResolvedValue(mockBlueprint as any);
        const selectQueue = [
            mockQueryBuilder([]),
            mockQueryBuilder([]),
            mockQueryBuilder([]),
            mockQueryBuilder([{ count: 1 }]),
            mockQueryBuilder([mockQuestion]),
        ];
        (db.select as any) = vi.fn().mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

        const result = await SelectionService.composeExam('u1', 'bp1', 'key1', { subjectIds: ['s1'], difficulty: 'simple', questionCount: 1 });
        expect(result.questions.length).toBeGreaterThan(0);
    });

    it('uses domainCond fallback filter', async () => {
         const bpNoScope = { ...mockBlueprint, subjects: [], topics: [], subtopics: [] as string[] };
         vi.spyOn(db.query.examBlueprints, 'findFirst').mockResolvedValue(bpNoScope as any);
         const selectQueue = [
            mockQueryBuilder([]),
            mockQueryBuilder([]),
            mockQueryBuilder([{ id: 's1' }]),
            mockQueryBuilder([{ id: 't1' }]),
            mockQueryBuilder([{ count: 1 }]),
            mockQueryBuilder([mockQuestion]),
         ];
         (db.select as any) = vi.fn().mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

         const result = await SelectionService.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
         expect(result.questions.length).toBeGreaterThan(0);
    });

    it('triggers wrap-around logic in sampling', async () => {
        vi.spyOn(db.query.examBlueprints, 'findFirst').mockResolvedValue(mockBlueprint as any);

        (db.select as any)
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([{ count: 1 }])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([mockQuestion]));

        const result = await SelectionService.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
        expect(result.questions).toHaveLength(1);
    });

    it('throws error when no questions are found in any pool', async () => {
        vi.spyOn(db.query.examBlueprints, 'findFirst').mockResolvedValue(mockBlueprint as any);
        (db.select as any).mockImplementation(() => mockQueryBuilder([{ count: 0 }]));

        await expect(SelectionService.composeExam('u1', 'bp1', 'key1')).rejects.toThrow('No questions found');
    });
  });
});
