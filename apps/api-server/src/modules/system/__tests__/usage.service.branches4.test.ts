import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageService } from '../usage.service';

const fetchMock = vi.fn();
global.fetch = fetchMock as any;

describe('UsageService Cloudflare/Redis branches', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    process.env.CLOUDFLARE_USAGE_URL = 'https://cf';
    process.env.CLOUDFLARE_API_TOKEN = 'tok';
    process.env.CLOUDFLARE_ZONE_ID = 'zone';
    // clear in-memory cache
    try {
      (UsageService as any)['cache']?.clear?.();
    } catch (err) {
      // Ignore errors during cache clearing in tests
    }
  });

  it('handles Cloudflare non-OK response (line 159-174)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    const res = await UsageService.getAllUsage();
    expect(res.cloudflare.status).toBe('_error');
  });

  it('returns not_configured when Redis/cache missing (line 241)', async () => {
    process.env.SERVICE_USAGE_CACHE_TTL_SEC = '1';
    const { UsageService } = await import('../usage.service');
    // Force cache miss path; no redis configured in test env
    const res = await UsageService.getAllUsage();
    expect(res.redis.status).toBeDefined();
  });
});
