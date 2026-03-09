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
        select: vi.fn(),
        query: { examBlueprints: { findFirst: vi.fn() } }
    },
    examBlueprints: { tableName: 'exam_blueprints', id: 'id' },
    subjects: { tableName: 'subjects' },
    topics: { tableName: 'topics' },
    subtopics: { tableName: 'subtopics' },
    questions: { tableName: 'questions', id: 'id', status: 'active', difficulty: 'difficulty' }
}));

describe('SelectionService composition mixed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(SelectionService, new SelectionService(db as any, { get: vi.fn(), set: vi.fn() } as any));
    });

    it('handles mixed difficulty distribution', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue({ id: 'bp1' } as any);
        
        let callCount = 0;
        vi.mocked(db.select).mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
                // First call: Fetch all matching IDs with difficulty
                return mockQueryBuilder([
                    { id: 'q1', difficulty: 'simple' },
                    { id: 'q2', difficulty: 'intermediate' },
                    { id: 'q3', difficulty: 'expert' }
                ]);
            }
            // Second call: Fetch full objects for sampled IDs
            return mockQueryBuilder([
                { id: 'q1', difficulty: 'simple', questionText: 'Q1' },
                { id: 'q2', difficulty: 'intermediate', questionText: 'Q2' },
                { id: 'q3', difficulty: 'expert', questionText: 'Q3' }
            ]);
        });

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'mixed', questionCount: 10 });
        expect(result.questions.length).toBeGreaterThan(0);
    });
});
