import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { SelectionService } from '../selection.service';
import { container } from '../../core/container';

const mockQueryBuilder = (result: any = []) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
} as any);

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        query: {
            examBlueprints: { findFirst: vi.fn() },
            questions: { findMany: vi.fn() }
        },
        select: vi.fn()
    },
    examBlueprints: { tableName: 'exam_blueprints', id: 'id', domains: 'domains' },
    subjects: { tableName: 'subjects', domainId: 'domain_id' },
    topics: { tableName: 'topics', subjectId: 'subject_id' },
    subtopics: { tableName: 'subtopics', topicId: 'topic_id' },
    questions: { tableName: 'questions', id: 'id', status: 'active', difficulty: 'difficulty' }
}));

describe('SelectionService Guard 2', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        
        vi.mocked(db.select).mockImplementation(() => mockQueryBuilder([{ count: 1 }]));
        container.register(SelectionService, new SelectionService(db as any, { get: vi.fn(), set: vi.fn() } as any));
    });

    it('guard: handles transient blueprint when resolution fails', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue(undefined);
        
        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'none', 'key1');
        expect(result.blueprint.id).toBe('transient');
    });
});

