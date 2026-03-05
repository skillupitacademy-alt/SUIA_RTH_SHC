import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { SelectionService } from '../selection.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
    db: {
        query: { examBlueprints: { findFirst: vi.fn() } }
    },
    examBlueprints: { tableName: 'exam_blueprints', id: 'id' }
}));

describe('SelectionService resolveBlueprint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(SelectionService, new SelectionService(db as any, { get: vi.fn(), set: vi.fn() } as any));
    });

    it('resolves blueprint by ID successfully', async () => {
        vi.mocked(db.query.examBlueprints.findFirst).mockResolvedValue({ id: 'bp1' } as any);
        const service = container.get(SelectionService);
        // Accessing private method via bracket notation for testing
        const result = await (service as any).resolveBlueprint('u1', 'bp1');
        expect(result.id).toBe('bp1');
    });
});
