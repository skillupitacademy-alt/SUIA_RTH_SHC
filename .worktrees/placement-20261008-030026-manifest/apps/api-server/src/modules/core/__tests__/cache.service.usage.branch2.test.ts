import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CacheService } from '../cache.service';

const resetSingleton = () => {
  (CacheService as unknown as { instance?: CacheService }).instance = undefined;
};

describe('CacheService.getUsage branch edges', () => {
  beforeEach(() => {
    resetSingleton();
    vi.useRealTimers();
  });

  it('parses usage when only execute() is available and dbsize missing', async () => {
    const execute = vi.fn(async () => 'used_memory_human: 1.2K\r\nused_memory: 1234\r\n');
    const redisMock = { execute };
    const svc = CacheService.getInstance({ redis: redisMock as any });

    const result = await svc.getUsage();

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      configured: true,
      keys: 0, // dbsize missing -> fallback to 0
      memory: '1.2K',
      memoryBytes: 1234,
    });
  });

  it('handles info object shape and dbsize value', async () => {
    const info = vi.fn(async () => ({ used_memory_human: '2M', used_memory: 2_000_000 }));
    const dbsize = vi.fn(async () => 5);
    const redisMock = { info, dbsize };
    const svc = CacheService.getInstance({ redis: redisMock as any });

    const result = await svc.getUsage();

    expect(info).toHaveBeenCalledTimes(1);
    expect(dbsize).toHaveBeenCalledTimes(1);
    expect(result.memory).toBe('2M');
    expect(result.memoryBytes).toBe(2_000_000);
    expect(result.keys).toBe(5);
  });

  it('returns configured:true fallback when downstream stats throw', async () => {
    const info = vi.fn(async () => null);
    const dbsize = vi.fn(async () => {
      throw new Error('boom');
    });
    const redisMock = { info, dbsize };
    const svc = CacheService.getInstance({ redis: redisMock as any });

    const result = await svc.getUsage();

    expect(info).toHaveBeenCalledTimes(1);
    expect(dbsize).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      configured: true,
      keys: 0,
      memory: '0B',
      memoryBytes: 0,
    });
  });

  it('falls back to configured:true when both info and dbsize time out (withTimeout catch)', async () => {
    vi.useFakeTimers();
    // Never-resolving promises trigger withTimeout rejection
    const info = vi.fn(() => new Promise(() => {}));
    const dbsize = vi.fn(() => new Promise(() => {}));
    const redisMock = { info, dbsize };
    const svc = CacheService.getInstance({ redis: redisMock as any });

    const usagePromise = svc.getUsage();
    // Advance beyond REDIS_TIMEOUT_MS (1000ms) so withTimeout rejects
    vi.advanceTimersByTime(1200);
    const result = await usagePromise;

    expect(info).toHaveBeenCalledTimes(1);
    expect(dbsize).toHaveBeenCalledTimes(1);
    expect(result.configured).toBe(true);
    expect(result.keys).toBe(0);
    expect(result.memoryBytes).toBe(0);
    expect(result.memory).toBe('0B');
    vi.useRealTimers();
  });
});
