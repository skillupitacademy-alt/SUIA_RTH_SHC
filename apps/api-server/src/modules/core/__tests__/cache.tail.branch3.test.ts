import { describe, it, expect, vi } from 'vitest';
import { CacheService } from '../cache.service';

// Extra tail coverage: remainingMs <= 0 branch and getUsage catch path

describe('CacheService tail branches extras', () => {
  it('increment uses windowMs when TTL unknown (remainingMs <= 0)', async () => {
    const mockRedis = null;
    (CacheService as any).instance = undefined;
    const service: any = CacheService.getInstance({ redis: mockRedis });
    // Force cache TTL negative
    service.cache.set('k-ttl', 2, { ttl: 10 });
    // Monkey-patch getRemainingTTL to return -1 to hit else path (lines ~215-218)
    service.cache.getRemainingTTL = vi.fn().mockReturnValue(-1);
    const res = await service.increment('k-ttl', 5000);
    expect(res.count).toBe(3); // two existing + new increment
  });

  it('getUsage catch block when info/execute/dbsize all throw', async () => {
    const redis = {
      info: vi.fn().mockRejectedValue(new Error('info boom')),
      execute: vi.fn().mockRejectedValue(new Error('exec boom')),
      dbsize: vi.fn().mockRejectedValue(new Error('dbsize boom')),
    } as any;
    (CacheService as any).instance = undefined;
    const service: any = CacheService.getInstance({ redis });
    const usage = await service.getUsage();
    expect(usage.configured).toBe(true);
    expect(usage.memory).toMatch(/^0 ?B$/);
  });
});
