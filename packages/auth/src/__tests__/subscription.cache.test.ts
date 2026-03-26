import { afterEach, describe, expect, it, vi } from 'vitest';

let redisGet = vi.fn();
let redisSet = vi.fn();

vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = redisGet;
    set = redisSet;
  },
}));

afterEach(() => {
  vi.resetModules();
  redisGet.mockReset();
  redisSet.mockReset();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe('subscription cache', () => {
  it('returns null and false when redis is not configured', async () => {
    const mod = await import('../subscription.cache');

    await expect(mod.getSubscriptionCache('user-1')).resolves.toBeNull();
    await expect(mod.setSubscriptionCache('user-1', { plan: 'pro' })).resolves.toBe(false);
  });

  it('loads, stores, and returns cached subscription snapshots', async () => {
    redisGet.mockResolvedValueOnce(null).mockResolvedValueOnce(JSON.stringify({ plan: 'pro', active: true }));
    redisSet.mockResolvedValue(undefined);
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    const mod = await import('../subscription.cache');
    const loader = vi.fn().mockResolvedValue({ plan: 'pro', active: true });

    await expect(mod.getOrSetSubscriptionCache('user-1', loader)).resolves.toEqual({ plan: 'pro', active: true });
    await expect(mod.getSubscriptionCache('user-1')).resolves.toEqual({ plan: 'pro', active: true });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith('sub:user-1', JSON.stringify({ plan: 'pro', active: true }), { ex: 300 });
  });
});
