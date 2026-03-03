import { describe, it, expect, vi, afterEach } from 'vitest';

import { CacheService, cacheService } from '../cache.service';
import { logger } from '@/lib/logger';

describe('CacheService deep branches', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    (CacheService as any).instance = cacheService;
  });

  it('set() uses withTimeout fallback when redis set rejects', async () => {
    (CacheService as any).instance = undefined;
    const redis = { set: vi.fn().mockRejectedValue(new Error('boom')) };
    const inst = CacheService.getInstance({ redis } as any);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    await inst.set('k', 'v', 100);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('delByPrefix catches errors and logs', async () => {
    const inst = CacheService.getInstance();
    vi.spyOn(inst['cache'], 'keys').mockImplementation(() => {
      throw new Error('iter fail');
    });
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    await inst.delByPrefix('pref');
    expect(spy).toHaveBeenCalled();
  });

  it('increment restores ttl from remainingMs path', async () => {
    const inst = CacheService.getInstance();
    inst['cache'].set('cnt', 2, { ttl: 2000 });
    const remaining = inst['cache'].getRemainingTTL('cnt');
    expect(remaining).toBeGreaterThan(0);
    const res = await inst.increment('cnt', 5000);
    expect(res.count).toBe(3);
    expect(res.ttlRem).toBeGreaterThan(0);
  });

  it('getUsage returns configured=true when redis present but info throws', async () => {
    (CacheService as any).instance = undefined;
    const redis = {
      info: vi.fn().mockRejectedValue(new Error('info fail')),
      dbsize: vi.fn().mockResolvedValue(0),
    };
    const inst = CacheService.getInstance({ redis } as any);
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const res = await inst.getUsage();
    // when redis exists, configured should be true
    expect(res.configured).toBe(true);
    expect(spy).toHaveBeenCalled();
  });
});
