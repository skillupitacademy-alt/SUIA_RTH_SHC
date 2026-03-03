import { describe, it, expect } from 'vitest';
import { CacheService } from '../cache.service';

describe('CacheService final uncovered lines', () => {
  it('debug helper (line 90) when isDebug true', () => {
    (CacheService as any).instance = undefined;
    const svc: any = CacheService.getInstance({ redis: null });
    svc.isDebug = true;
    expect(() => svc.debug('op', 'key')).not.toThrow();
  });

  it('getUsage fallback when info/execute/dbsize all absent (line ~251)', async () => {
    (CacheService as any).instance = undefined;
    const redis = {}; // no info/execute/dbsize
    const svc: any = CacheService.getInstance({ redis });
    const res = await svc.getUsage();
    expect(res.configured).toBe(true);
    expect(res.memory).toBe('0B'); // default string path
  });

  it('getUsage catch block (lines 279-293) when withTimeout throws', async () => {
    (CacheService as any).instance = undefined;
    const redis = { info: () => Promise.resolve('used_memory_human: 10K') } as any;
    const svc: any = CacheService.getInstance({ redis });
    svc.withTimeout = () => { throw new Error('forced timeout'); };
    const res = await svc.getUsage();
    expect(res.memory).toBe('Connected');
  });
});
