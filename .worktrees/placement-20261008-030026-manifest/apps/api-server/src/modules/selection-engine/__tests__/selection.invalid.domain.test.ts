import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectionService } from '../selection.service';
import { container } from '../../core/container';

describe('SelectionService invalid domain', () => {
    beforeEach(() => {
        container.reset();
        const mockDb = {
            query: {
                examBlueprints: { findFirst: vi.fn().mockResolvedValue(null) }
            }
        };
        const mockCache = { get: vi.fn().mockResolvedValue(null), set: vi.fn() };
        container.register(SelectionService, new SelectionService(mockDb as any, mockCache as any));
    });

    it('throws if domainId is provided as empty string', async () => {
        const service = container.get(SelectionService);
        await expect(service.composeExam('u1', '', 'k1')).rejects.toThrow('Selection criteria');
    });
});
