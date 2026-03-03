import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CacheService } from '../cache.service';

const createMockRedis = () => {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    pexpire: vi.fn(),
    pttl: vi.fn(),
    info: vi.fn(),
    dbsize: vi.fn(),
  };
};

describe('CacheService cooldown tails', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let svc: CacheService;

  beforeEach(() => {
    redis = createMockRedis();
    // Fresh singleton per test by resetting the static instance
    (CacheService as any).instance = undefined;
    svc = CacheService.getInstance({ redis } as any);
  });

  it('withTimeout enters cooldown and returns fallback on timeout', async () => {
    redis.get.mockImplementation(
      () => new Promise((_res, rej) => setTimeout(() => rej(new Error('slow')), 1100))
    );

    const start = Date.now();
    const result = await (svc as any).withTimeout(redis.get('k'), 'fallback');
    expect(result).toBe('fallback');
    // cooldown set
    expect((svc as any).redisDeadUntil).toBeGreaterThan(start);
  });

  it('skips redis when in cooldown and returns fallback', async () => {
    // manually set cooldown in the future
    (svc as any).redisDeadUntil = Date.now() + 60000;
    const result = await (svc as any).withTimeout(Promise.resolve('ignored'), 'fallback2');
    expect(result).toBe('fallback2');
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('getUsage falls back when info/dbsize throw and still returns configured state', async () => {
    redis.info.mockRejectedValue(new Error('info fail'));
    redis.execute = vi.fn().mockRejectedValue(new Error('exec fail'));
    redis.dbsize.mockRejectedValue(new Error('db fail'));

    const res = await svc.getUsage();
    expect(res.configured).toBe(true);
    expect(res.keys).toBe(0);
    expect(res.memory).toBe('0B');
  });
});
