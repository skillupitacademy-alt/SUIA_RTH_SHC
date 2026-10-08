import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { UsageService } from '../usage.service';

describe('UsageService cache hit short-circuits downstream calls', () => {
  const okState = { status: 'ok', configured: true, checkedAt: new Date().toISOString() };

  let neonSpy: ReturnType<typeof vi.spyOn>;
  let redisSpy: ReturnType<typeof vi.spyOn>;
  let resendSpy: ReturnType<typeof vi.spyOn>;
  let cfSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear the internal LRU so every test starts cold.
    (UsageService as any).cache?.clear?.();

    neonSpy = vi.spyOn(UsageService as any, 'getNeonUsage').mockResolvedValue(okState as any);
    redisSpy = vi.spyOn(UsageService as any, 'getRedisUsage').mockResolvedValue(okState as any);
    resendSpy = vi.spyOn(UsageService as any, 'getResendStatus').mockResolvedValue(okState as any);
    cfSpy = vi.spyOn(UsageService as any, 'getCloudflareStats').mockResolvedValue(okState as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns cached snapshot on subsequent calls without invoking providers again', async () => {
    // First call populates cache
    const first = await UsageService.getAllUsage();
    expect(first.neon.status).toBe('ok');
    expect(neonSpy).toHaveBeenCalledTimes(1);
    expect(redisSpy).toHaveBeenCalledTimes(1);
    expect(resendSpy).toHaveBeenCalledTimes(1);
    expect(cfSpy).toHaveBeenCalledTimes(1);

    // Reset call counts and make providers throw to prove cache is used
    neonSpy.mockClear();
    redisSpy.mockClear();
    resendSpy.mockClear();
    cfSpy.mockClear();

    neonSpy.mockRejectedValue(new Error('should not be hit'));
    redisSpy.mockRejectedValue(new Error('should not be hit'));
    resendSpy.mockRejectedValue(new Error('should not be hit'));
    cfSpy.mockRejectedValue(new Error('should not be hit'));

    const second = await UsageService.getAllUsage();
    expect(second).toEqual(first);

    expect(neonSpy).not.toHaveBeenCalled();
    expect(redisSpy).not.toHaveBeenCalled();
    expect(resendSpy).not.toHaveBeenCalled();
    expect(cfSpy).not.toHaveBeenCalled();
  });
});
