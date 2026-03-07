import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { SelectionService } from '../selection.service';
import { container } from '../../core/container';

const mockQueryBuilder = (result: any = []) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
} as any);

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        select: vi.fn(),
        query: { examBlueprints: { findFirst: vi.fn() } }
    },
    examBlueprints: { tableName: 'exam_blueprints', id: 'id' },
    subtopics: { tableName: 'subtopics', id: 'id', topicId: 'topic_id' },
    topics: { tableName: 'topics', id: 'id', subjectId: 'subject_id' },
    subjects: { tableName: 'subjects' },
    questions: { tableName: 'questions' }
}));

describe('SelectionService composition empty pools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(SelectionService, new SelectionService(db as any, { get: vi.fn(), set: vi.fn() } as any));
    });

    it('throws if no questions found in pool', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue({ id: 'bp1' } as any);
        vi.mocked(db.select).mockImplementation(() => mockQueryBuilder([{ count: 0 }]));

        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'key1')).rejects.toThrow('No questions found');
    });
});

