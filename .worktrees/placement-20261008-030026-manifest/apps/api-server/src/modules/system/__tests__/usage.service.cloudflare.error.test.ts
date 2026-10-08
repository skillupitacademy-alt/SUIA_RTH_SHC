import { describe, it, expect, vi } from 'vitest';

import { UsageService } from '../usage.service';

describe('UsageService cloudflare error path', () => {
  it('returns _error when Cloudflare API rejects', async () => {
    (UsageService as any).cache?.clear?.();

    process.env.CLOUDFLARE_API_TOKEN = 'tok';
    process.env.CLOUDFLARE_ZONE_ID = 'zone';

    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network'));

    const result = await UsageService['getCloudflareStats']();
    expect(result.configured).toBe(true);
    expect(result.status).toBe('_error');
    expect(result._error?.message).toMatch(/network/i);
  });
});
