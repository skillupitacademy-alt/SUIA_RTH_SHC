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
        query: {
            examBlueprints: { findFirst: vi.fn() },
            questions: { findMany: vi.fn() }
        }
    },
    examBlueprints: { tableName: 'exam_blueprints', id: 'id' },
    subjects: { tableName: 'subjects' },
    topics: { tableName: 'topics', subjectId: 'subject_id' },
    subtopics: { tableName: 'subtopics', topicId: 'topic_id' },
    questions: { tableName: 'questions', id: 'id', status: 'active', difficulty: 'difficulty', subtopicId: 'subtopic_id', topicId: 'topic_id' }
}));

describe('SelectionService Phase 3 requirements', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(SelectionService, new SelectionService(db as any, { get: vi.fn(), set: vi.fn() } as any));
    });

    it('composes exam at topic level (simple, 10 questions)', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue({ id: 'bp1' } as any);
        let callCount = 0;
        vi.mocked(db.select).mockImplementation(() => {
           callCount++;
           return mockQueryBuilder(callCount % 2 === 1 ? [{ count: 10 }] : [{ id: 'q' }]);
        });

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1', { topicIds: ['t1'] });
        expect(result.questions).toBeDefined();
    });

    it('returns static questions when blueprint carries questionIds', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue({ id: 'bp1', questionIds: ['q1'] } as any);
        vi.mocked(db.query.questions.findMany).mockResolvedValue([{ id: 'q1' }] as any);

        const service = container.get(SelectionService);
        const result = await service.composeExam('u1', 'bp1', 'key1');
        expect(result.questions).toHaveLength(1);
    });
});
