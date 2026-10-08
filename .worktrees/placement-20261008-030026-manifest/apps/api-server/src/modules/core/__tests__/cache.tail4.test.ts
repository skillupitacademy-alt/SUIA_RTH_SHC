import { describe, it, expect, vi } from 'vitest';
import { CacheService } from '../cache.service';

describe('CacheService memory formatting branch', () => {
    it('formats memory as 0 B when Unknown is returned (Line 288)', async () => {
        const mockRedis = { info: vi.fn().mockResolvedValue('used_memory_human: Unknown'), dbsize: vi.fn().mockResolvedValue(0) };
        const service = CacheService.getInstance({ redisUrl: 'redis://localhost:6379' } as any);
        (service as any).redis = mockRedis;

        const health = await service.getUsage();
        expect(health.memory).toBe('0 B');
    });
});
