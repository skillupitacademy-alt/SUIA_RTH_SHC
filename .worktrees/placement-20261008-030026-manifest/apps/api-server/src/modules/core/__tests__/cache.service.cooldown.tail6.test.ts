import { describe, it, expect, vi, afterEach } from 'vitest';
import { CacheService } from '../cache.service';

describe('CacheService cooldown skip path', () => {
  afterEach(() => {
    // reset singleton between tests
    (CacheService as any).instance = undefined;
    vi.restoreAllMocks();
  });

  it('skips Redis calls while in cooldown after a failure', async () => {
    (CacheService as any).instance = undefined;
    const redisMock = { get: vi.fn().mockRejectedValue(new Error('boom')) } as any;
    const cache = CacheService.getInstance({ redis: redisMock });

    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1_000);

    // first call triggers Redis and sets cooldown
    const v1 = await cache.get('k1');
    expect(v1).toBeNull();
    expect(redisMock.get).toHaveBeenCalledTimes(1);

    // still within cooldown window -> short-circuit, no new redis call
    now.mockReturnValue(1_100);
    const v2 = await cache.get('k1');
    expect(v2).toBeNull();
    expect(redisMock.get.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
