import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LRUCache } from 'lru-cache';

import { UsageService } from '../usage.service';

vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    getUsage: vi.fn(),
  },
}));

describe('UsageService branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset static cache
    (UsageService as any).cache = new LRUCache({ max: 10, ttl: 1 });
  });

  it('marks Redis as _error when cacheService.getUsage throws (lines ~159-174)', async () => {
    const { cacheService } = await import('@/modules/core/cache.service');
    (cacheService.getUsage as any).mockRejectedValue(new Error('redis down'));

    const res = await UsageService.getAllUsage();
    expect(res.redis.status).toBe('_error');
  });

  it('marks Cloudflare as _error when fetch returns non-ok (lines 236/241)', async () => {
    // Configure tokens so branch is taken
    process.env.CLOUDFLARE_API_TOKEN = 't';
    process.env.CLOUDFLARE_ZONE_ID = 'z';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'fail',
    });

    const res = await UsageService['getCloudflareStats']();
    expect(res.status).toBe('_error');
  });
});
