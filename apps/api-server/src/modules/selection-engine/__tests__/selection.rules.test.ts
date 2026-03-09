import { describe, it, expect, vi, beforeEach } from 'vitest';
import { container } from '../../core/container';
import { SelectionService } from '../selection.service';
import { cacheService } from '../../core/cache.service';
import { db } from '@quiz/db';

vi.mock('@quiz/db', () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
    query: {
      examBlueprints: { findFirst: vi.fn() },
      questions: { findMany: vi.fn() }
    }
  },
  examBlueprints: { id: 'id', totalQuestions: 'totalQuestions' },
  questions: { id: 'id', difficulty: 'difficulty', status: 'status', subtopicId: 'subtopicId', topicId: 'topicId' },
  topics: { id: 'id', subjectId: 'subjectId' },
  subtopics: { id: 'id', topicId: 'topicId' },
  subjects: { id: 'id', domainId: 'domainId' },
  STANDARD_QUERY_TIMEOUT: 1000,
  withTimeout: vi.fn((p) => p),
  and: vi.fn(),
  or: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  asc: vi.fn(),
  sql: vi.fn()
}));

vi.mock('../core/cache.service', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

describe('SelectionService Rules verification', () => {
    let service: SelectionService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new SelectionService();
    });

    it('applies Simple difficulty for Topic-level selection', async () => {
        const blueprint = { id: 'b1', totalQuestions: 10, subjects: [], topics: [], subtopics: [] };
        
        // Mock resolveBlueprint
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(blueprint as any);
        
        // Mock parents selects (empty for Topic)
        vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            then: vi.fn().mockImplementation((resolve) => resolve([]))
        } as any);

        const config = { topicIds: ['t1'] };
        const criteria = await (service as any).resolveSelectionCriteria('d1', config, blueprint);
        
        expect(criteria.difficultyPref).toBe('simple');
        expect(criteria.requestedTotal).toBe(10);
    });

    it('applies Mixed difficulty for Subtopic-level selection', async () => {
        const blueprint = { id: 'b1', totalQuestions: 10, subjects: [], topics: [], subtopics: [] };
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(blueprint as any);
        
        vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            then: vi.fn().mockImplementation((resolve) => resolve([{ topicId: 't1' }]))
        } as any);

        const config = { subtopicIds: ['st1'] };
        const criteria = await (service as any).resolveSelectionCriteria('d1', config, blueprint);
        
        expect(criteria.difficultyPref).toBe('mixed');
        expect(criteria.requestedTotal).toBe(10);
    });
});
