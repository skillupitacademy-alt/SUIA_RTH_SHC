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
        query: { examBlueprints: { findFirst: vi.fn() } }
    },
    examBlueprints: { tableName: 'exam_blueprints', id: 'id' }
}));

describe('SelectionService composition error', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(SelectionService, new SelectionService(db as any, { get: vi.fn(), set: vi.fn() } as any));
    });

    it('propagates database errors during resolution', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockRejectedValue(new Error('DB Error'));
        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', 'bp1', 'k1')).rejects.toThrow('DB Error');
    });
});

