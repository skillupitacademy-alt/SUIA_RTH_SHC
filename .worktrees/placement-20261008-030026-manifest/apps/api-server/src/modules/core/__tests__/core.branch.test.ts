import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheService } from '../cache.service';
import { QueueService } from '../queue.service';

describe('Core Utilities branch coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('QueueService.getInstance singleton branch (Line 33)', () => {
        (QueueService as any).instance = undefined;
        const inst1 = QueueService.getInstance();
        const inst2 = QueueService.getInstance();
        expect(inst1).toBe(inst2);
    });

    it('CacheService debug and key generation (Lines 90, 98-107)', () => {
        const service = CacheService.getInstance({ redis: null } as any);
        (service as any).isDebug = true;
        
        // This hits line 90-93 via private call or any set/get
        (service as any).debug('op', 'key');
        
        // Key generation (Lines 98-110)
        const key = service.generateKey('pref', { b: 2, a: 1 });
        expect(key).toBe('pref:{"a":1,"b":2}'); // stable sort
        
        const keyEmpty = service.generateKey('pref', null);
        expect(keyEmpty).toBe('pref:{}');
    });

    it('CacheService.increment and getUsage edge cases (Lines 195, 215, 251-282)', async () => {
        const redisMock = {
            incr: vi.fn(),
            pexpire: vi.fn(),
            pttl: vi.fn(),
            info: vi.fn(),
            execute: vi.fn(),
            dbsize: vi.fn()
        };
        (CacheService as any).instance = undefined;
        const service = CacheService.getInstance({ redis: redisMock } as any);

        // increment count === 1 path (Line 195)
        redisMock.incr.mockResolvedValue(1);
        redisMock.pttl.mockResolvedValue(5000);
        await service.increment('k1', 5000);
        expect(redisMock.pexpire).toHaveBeenCalled();

        // local fallback remaining TTL (Lines 215-218)
        (service as any).redis = null;
        await service.increment('l1', 5000); // first
        await service.increment('l1', 5000); // second hits remaining
        
        // getUsage object response (Lines 275-281)
        (service as any).redis = redisMock;
        redisMock.info.mockResolvedValue({ used_memory_human: '4M', used_memory: 4000 });
        const usage = await service.getUsage();
        expect(usage.memory).toBe('4M');
    });
});
