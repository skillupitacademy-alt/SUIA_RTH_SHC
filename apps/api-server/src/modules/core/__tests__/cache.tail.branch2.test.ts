import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../cache.service';

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}));

describe('CacheService deeper tails (218,251,279-293)', () => {
  let redisMock: any;
  let service: any;

  beforeEach(() => {
    vi.useFakeTimers();
    redisMock = {
      get: vi.fn(),
      set: vi.fn(),
      incr: vi.fn(),
      pexpire: vi.fn(),
      pttl: vi.fn(),
      info: vi.fn(),
      execute: vi.fn(),
      dbsize: vi.fn(),
    };
    (CacheService as any).instance = undefined;
    service = CacheService.getInstance({ redis: redisMock });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips redis when redisDeadUntil in future (cooldown short-circuit, ~218)', async () => {
    (service as any).redisDeadUntil = Date.now() + 10_000;
    const res = await (service as any).withTimeout(Promise.resolve('should-skip'), 'fb');
    expect(res).toBe('fb');
  });

  it('getUsage handles execute/dbsize fallback (251,279-293)', async () => {
    (service as any).redisDeadUntil = 0;
    redisMock.info.mockRejectedValue(new Error('info fail'));
    redisMock.execute.mockResolvedValue('used_memory_human: 1KB\r\nused_memory: 1234');
    redisMock.dbsize.mockResolvedValue(7);
    const res = await service.getUsage();
    expect(redisMock.dbsize).toHaveBeenCalled();
    expect(res.configured).toBe(true);
    expect(res.memoryBytes).toBeGreaterThanOrEqual(0);
  });
});
