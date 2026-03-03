import { describe, it, expect, vi } from 'vitest';

import { cacheService } from '@/modules/core/cache.service';
import { UsageService } from '../usage.service';

describe('UsageService redis usage thresholds', () => {
  it('marks warning/_error when usage crosses limits', async () => {
    (UsageService as any).cache?.clear?.();

    vi.spyOn(cacheService, 'getUsage').mockResolvedValue({
      configured: true,
      keys: 10,
      memory: '120MB',
      memoryBytes: 120 * 1024 * 1024, // 120 MB
    });

    process.env.REDIS_MEMORY_LIMIT_MB = '100';

    const result = await UsageService['getRedisUsage']();
    expect(result.configured).toBe(true);
    expect(result.status).toBe('_error'); // >95%
    expect(result.metrics?.usagePercent).toBeGreaterThanOrEqual(100);
  });
});
