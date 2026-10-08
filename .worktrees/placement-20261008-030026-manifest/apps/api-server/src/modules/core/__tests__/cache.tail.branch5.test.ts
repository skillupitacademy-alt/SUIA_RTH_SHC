import { describe, it, expect, vi } from 'vitest';
import { CacheService } from '../cache.service';

describe('CacheService remaining uncovered branches', () => {
  it('getUsage returns configured:false when redis missing (early return)', async () => {
    (CacheService as any).instance = undefined;
    const svc: any = CacheService.getInstance({ redis: null });
    const res = await svc.getUsage();
    expect(res.configured).toBe(false);
  });

  it('getUsage uses execute fallback when info missing and no dbsize function', async () => {
    (CacheService as any).instance = undefined;
    const redis = {
      execute: vi.fn().mockResolvedValue('used_memory_human: 1M\nused_memory: 1048576'),
    } as any;
    const svc: any = CacheService.getInstance({ redis });
    const res = await svc.getUsage();
    expect(res.memory).toBe('1M');
    expect(res.keys).toBe(0);
  });

  it('getUsage catch block when withTimeout throws', async () => {
    (CacheService as any).instance = undefined;
    const redis = {
      info: vi.fn(),
      dbsize: vi.fn(),
    } as any;
    const svc: any = CacheService.getInstance({ redis });
    svc.withTimeout = () => { throw new Error('timeout boom'); };
    const res = await svc.getUsage();
    expect(res.configured).toBe(true);
    expect(res.memory).toBe('Connected');
  });
});
