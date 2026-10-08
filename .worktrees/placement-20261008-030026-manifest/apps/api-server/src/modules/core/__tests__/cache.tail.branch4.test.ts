import { describe, it, expect } from 'vitest';
import { CacheService } from '../cache.service';

describe('CacheService remaining tails', () => {
  it('debug helper logs when isDebug true (line 90)', () => {
    const svc: any = CacheService.getInstance({ redis: null });
    svc.isDebug = true;
    // Should not throw
    svc.debug('op', 'key');
  });

  it('getUsage parses used_memory_human string (line 251 path)', async () => {
    (CacheService as any).instance = undefined;
    const redis = {
      info: () => Promise.resolve('used_memory_human: 512K\r\nused_memory: 524288'),
      dbsize: () => Promise.resolve(2),
    } as any;
    const svc: any = CacheService.getInstance({ redis });
    const res = await svc.getUsage();
    expect(res.memory).toBe('512K');
    expect(res.keys).toBe(2);
  });
});
