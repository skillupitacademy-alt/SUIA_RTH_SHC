import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheService } from '../cache.service';
import { logger } from '@/lib/logger';

vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        child: () => ({ info: vi.fn(), debug: vi.fn(), error: vi.fn() })
    }
}));

describe('CacheService extreme tail coverage', () => {
    let mockRedis: any;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockRedis = {
            on: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
            keys: vi.fn(),
            pipeline: vi.fn(),
            info: vi.fn(),
            execute: vi.fn(),
            dbsize: vi.fn().mockResolvedValue(0)
        };
    });

    it('getUsage(): memoryBytesRaw is an object (Line 279-281 skip)', async () => {
        // mock info to return object where used_memory is an array/object
        mockRedis.info.mockResolvedValue({
            used_memory_human: '100K',
            used_memory: [] // not string, not number
        });
        
        (CacheService as any).instance = undefined;
        const service = CacheService.getInstance({ redis: mockRedis });

        const usage = await service.getUsage();
        expect(usage.memoryBytes).toBe(0);
        expect(usage.memory).toBe('100K');
    });

    it('getUsage(): catches primitive string error and handles execute method existence (Line 291-295)', async () => {
        mockRedis.info.mockImplementation(() => { throw 'String Fault'; });
        mockRedis.execute = vi.fn(); // defined

        (CacheService as any).instance = undefined;
        const service = CacheService.getInstance({ redis: mockRedis });

        const usage = await service.getUsage();
        expect(usage.configured).toBe(true);
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ err: 'Unknown Fault', hasInfo: true, hasExecute: true }),
            expect.any(String)
        );
    });
});
