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
    container.reset();
    container.register(SelectionService, new SelectionService(db as any, cacheService as any));
    
    vi.mocked(cacheService.get).mockResolvedValue(null);
    vi.mocked(cacheService.set).mockResolvedValue(undefined as any);
    vi.mocked(db.select).mockImplementation(() => mockQueryBuilder([]));
  });

  describe('composeExam', () => {
    it('bypasses calculation for static blueprints', async () => {
       const staticBp = { ...mockBlueprint, questionIds: ['q1', 'q2'] };
       vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(staticBp as any);
       vi.mocked(db.query.questions.findMany).mockResolvedValue([mockQuestion, { ...mockQuestion, id: 'q2' }] as any);

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
  });

  describe('resolveBlueprint', () => {
    it('uses cached blueprint without hitting DB lookups', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(mockBlueprint as any);

      const service = container.get(SelectionService);
      const result = await (service as any).resolveBlueprint('u1', 'bp1', {});
      expect(result.id).toBe('bp1');
      expect(db.query.examBlueprints.findFirst).not.toHaveBeenCalled();
    });

    it('uses transient blueprint if none found in DB', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(undefined);
        
        vi.mocked(db.select)
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([{ count: 1 }])) 
            .mockReturnValueOnce(mockQueryBuilder([mockQuestion]));

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'none', 'key1', { questionCount: 5, difficulty: 'simple' });
        expect(result.blueprint.id).toBe('transient');
    });

    it('resolves by domains overlap if direct ID lookup fails', async () => {
        vi.mocked(db.query.examBlueprints.findFirst)
            .mockResolvedValueOnce(undefined) 
            .mockResolvedValueOnce(mockBlueprint as any); 

        vi.mocked(db.select)
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([{ count: 1 }])) 
            .mockReturnValueOnce(mockQueryBuilder([mockQuestion]));

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'd1', 'key1', { difficulty: 'simple' });
        expect(result.blueprint.id).toBe('bp1');
    });
  });

  describe('resolveSelectionCriteria', () => {
    it('throws if domainId is missing', async () => {
        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', '', 'key1')).rejects.toThrow('Selection criteria');
    });

    it('filters out parent topics if children subtopics are specified', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        const selectQueue = [
            mockQueryBuilder([{ topicId: 't1' }]),
            mockQueryBuilder([]),
            mockQueryBuilder([]),
            mockQueryBuilder([{ count: 1 }]),
            mockQueryBuilder([mockQuestion]),
        ];
        vi.mocked(db.select).mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { subtopicIds: ['st1'], topicIds: ['t1'], difficulty: 'simple', questionCount: 1 });
        expect(result.questions.length).toBeGreaterThan(0);
    });

    it('auto-fills count for topic depth when difficulty is provided', async () => {
      const selectQueue = [
        mockQueryBuilder([]), // selectedTopicParents
        mockQueryBuilder([{ subjectId: 's1' }]), // selectedSubjectParents
      ];
      vi.mocked(db.select).mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

      const blueprintNoSubtopics = { ...mockBlueprint, subtopics: [] };
      const criteria = await SelectionService.resolveSelectionCriteria('d1', { topicIds: ['t1'], difficulty: 'simple' }, blueprintNoSubtopics as any);
      expect(criteria.requestedTotal).toBe(10);
      expect(criteria.difficultyPref).toBe('simple');
    });

    it('auto-fills count for subtopic depth when difficulty is provided', async () => {
      const selectQueue = [
        mockQueryBuilder([{ topicId: 't1' }]), // selectedTopicParents
        mockQueryBuilder([]), // selectedSubjectParents
      ];
      vi.mocked(db.select).mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

      const criteria = await SelectionService.resolveSelectionCriteria('d1', { subtopicIds: ['st1'], difficulty: 'mixed' }, mockBlueprint as any);
      expect(criteria.requestedTotal).toBe(10);
      expect(criteria.difficultyPref).toBe('mixed');
    });

    it('auto-fills mixed difficulty for subtopic depth when difficulty is missing', async () => {
      const selectQueue = [
        mockQueryBuilder([{ topicId: 't1' }]), // selectedTopicParents
        mockQueryBuilder([]), // selectedSubjectParents
      ];
      vi.mocked(db.select).mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

      const criteria = await SelectionService.resolveSelectionCriteria('d1', { subtopicIds: ['st1'] }, mockBlueprint as any);
      expect(criteria.requestedTotal).toBe(10);
      expect(criteria.difficultyPref).toBe('mixed');
    });

    it('keeps provided count when only difficulty is missing', async () => {
      const selectQueue = [
        mockQueryBuilder([]), // selectedTopicParents
        mockQueryBuilder([{ subjectId: 's1' }]), // selectedSubjectParents
      ];
      vi.mocked(db.select).mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

      const blueprintNoSubtopics = { ...mockBlueprint, subtopics: [] };
      const criteria = await SelectionService.resolveSelectionCriteria('d1', { topicIds: ['t1'], questionCount: 7 }, blueprintNoSubtopics as any);
      expect(criteria.requestedTotal).toBe(7);
      expect(criteria.difficultyPref).toBe('simple');
    });
  });

  describe('executeDynamicSelection', () => {
    it('uses subjectTopicCond when actualSubjectIds is populated', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        const selectQueue = [
            mockQueryBuilder([]),
            mockQueryBuilder([]),
            mockQueryBuilder([]),
            mockQueryBuilder([{ count: 1 }]),
            mockQueryBuilder([mockQuestion]),
        ];
        vi.mocked(db.select).mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { subjectIds: ['s1'], difficulty: 'simple', questionCount: 1 });
        expect(result.questions.length).toBeGreaterThan(0);
    });

    it('uses domainCond fallback filter', async () => {
         const bpNoScope = { ...mockBlueprint, subjects: [], topics: [], subtopics: [] };
         vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(bpNoScope as any);
         const selectQueue = [
            mockQueryBuilder([]),
            mockQueryBuilder([]),
            mockQueryBuilder([{ id: 's1' }]),
            mockQueryBuilder([{ id: 't1' }]),
            mockQueryBuilder([{ count: 1 }]),
            mockQueryBuilder([mockQuestion]),
         ];
         vi.mocked(db.select).mockImplementation(() => selectQueue.shift() ?? mockQueryBuilder([{ count: 1 }]));

         const service = container.get(SelectionService);
         const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
         expect(result.questions.length).toBeGreaterThan(0);
    });

    it('triggers wrap-around logic in sampling', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);

        vi.mocked(db.select)
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([{ count: 1 }])) 
            .mockReturnValueOnce(mockQueryBuilder([])) 
            .mockReturnValueOnce(mockQueryBuilder([mockQuestion]));

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'simple', questionCount: 1 });
        expect(result.questions).toHaveLength(1);
    });

    it('throws error when no questions are found in any pool', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(mockBlueprint as any);
        vi.mocked(db.select).mockImplementation(() => mockQueryBuilder([{ count: 0 }]));

        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1')).rejects.toThrow('No questions found');
    });
  });
});
