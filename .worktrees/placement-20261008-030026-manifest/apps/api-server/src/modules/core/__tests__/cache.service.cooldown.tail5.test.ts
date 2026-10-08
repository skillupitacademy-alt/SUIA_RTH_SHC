import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CacheService } from '../cache.service';

// These tests focus on the remaining cooldown/timeout branches inside withTimeout/get.

describe('CacheService cooldown/timeout tails', () => {
  beforeEach(() => {
    // Reset singleton between tests to avoid cross-test state (redisDeadUntil, cache contents)
    (CacheService as unknown as { instance?: CacheService }).instance = undefined;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns fallback null when cooldown already active (redis call not prevented but result falls back)', async () => {
    const redisMock = { get: vi.fn() };
    const svc = CacheService.getInstance({ redis: redisMock as any });
    // Force cooldown active
    (svc as any).redisDeadUntil = Date.now() + 10_000;

    const result = await svc.get('missing-key');

    expect(result).toBeNull();
    // redis.get is invoked before withTimeout sees cooldown; ensure cooldown remains unchanged
    expect(redisMock.get).toHaveBeenCalledTimes(1);
    expect((svc as any).redisDeadUntil).toBeGreaterThan(Date.now());
  });

  it('enters cooldown when Redis promise times out and falls back to null', async () => {
    const neverResolving = new Promise(() => {});
    const redisMock = { get: vi.fn(() => neverResolving) };
    const svc = CacheService.getInstance({ redis: redisMock as any });

    const getPromise = svc.get('slow-key');

    // Advance past REDIS_TIMEOUT_MS (1000ms) to trigger timeout branch
    vi.advanceTimersByTime(1200);
    const result = await getPromise;

    expect(result).toBeNull();
    // cooldown should be set in the future
    expect((svc as any).redisDeadUntil).toBeGreaterThan(Date.now());
  });
});
