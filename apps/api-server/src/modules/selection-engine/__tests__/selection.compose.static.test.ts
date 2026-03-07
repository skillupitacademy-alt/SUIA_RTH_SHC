import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { SelectionService } from '../selection.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        query: {
            questions: { findMany: vi.fn() },
            examBlueprints: { findFirst: vi.fn() }
        }
    },
    questions: { tableName: 'questions', id: 'id', status: 'active' },
    examBlueprints: { tableName: 'exam_blueprints', id: 'id' }
}));

describe('SelectionService static composition', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(SelectionService, new SelectionService(db as any, {} as any));
    });

  it('returns static questions when blueprint has questionIds', async () => {
    const service = container.get(SelectionService);
    const mockQuestions = [{ id: 'q1' }, { id: 'q2' }];
    vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue({ id: 'bp1', questionIds: ['q1', 'q2'] } as any);
    vi.mocked(db.query.questions.findMany).mockResolvedValue(mockQuestions as any);

    const result = await service.composeExam('u1', 'bp1', 'key1');
    expect(result.questions).toHaveLength(2);
    expect(db.query.questions.findMany).toHaveBeenCalled();
  });
});

