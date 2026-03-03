import { describe, it, expect, afterEach } from 'vitest';
import { CacheService } from '../cache.service';

describe('CacheService.increment error catch branch', () => {
  afterEach(() => {
    (CacheService as any).instance = undefined;
  });

  it('returns fallback when local cache access throws', async () => {
    const cache = CacheService.getInstance();
    // Force cache.get to throw inside increment
    (cache as any).cache.get = () => {
      throw new Error('boom');
    };

    const res = await cache.increment('err-key', 1000);
    expect(res.count).toBe(1);
    expect(res.ttlRem).toBe(60);
  });
});
