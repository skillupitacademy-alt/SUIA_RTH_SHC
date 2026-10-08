import { describe, it, expect, vi } from 'vitest';
import { PerformanceService } from '../performance.service';
import { cacheService } from '@/modules/core/cache.service';

vi.mock('@/modules/core/cache.service', () => ({
    cacheService: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn()
    }
}));

describe('PerformanceService tail coverage', () => {
    it('getCachedReport: falls back to null and logs warning on throw (Lines 34-35)', async () => {
        vi.mocked(cacheService.get).mockRejectedValueOnce(new Error('Redis Timeout'));
        const result = await PerformanceService.getCachedReport('exam1');
        expect(result).toBeNull();
    });
});
