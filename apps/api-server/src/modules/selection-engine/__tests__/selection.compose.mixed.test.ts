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
            // Mock both count(*) and selection calls
            // For mixed, it requests 3 simple, 3 intermediate, 4 expert (for total 10)
            // Each tier does 1 count + 1 select
            return mockQueryBuilder(callCount % 2 === 1 ? [{ count: 1 }] : [{ id: 'q'+callCount }]);
        });

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { difficulty: 'mixed', questionCount: 10 });
        expect(result.questions.length).toBeGreaterThan(0);
    });
});
