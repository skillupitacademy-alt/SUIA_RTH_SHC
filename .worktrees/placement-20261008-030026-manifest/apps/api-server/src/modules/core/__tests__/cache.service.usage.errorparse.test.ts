import { describe, it, expect, vi } from 'vitest';

import { CacheService } from '../cache.service';

const resetSingleton = () => {
  (CacheService as unknown as { instance?: CacheService }).instance = undefined;
};

describe('CacheService.getUsage hard error path', () => {
  it('returns configured:true fallback when parsing usage throws', async () => {
    resetSingleton();

    // used_memory_human getter throws when accessed, pushing execution into the outer catch block (lines 292-298).
    const infoPayload = {
      get used_memory_human() {
        throw new Error('parse failure');
      },
      used_memory: 500,
    };

    const info = vi.fn(async () => infoPayload);
    const dbsize = vi.fn(async () => 3);
    const redisMock = { info, dbsize };

    const svc = CacheService.getInstance({ redis: redisMock as any });
    const result = await svc.getUsage();

    expect(info).toHaveBeenCalledTimes(1);
    expect(dbsize).toHaveBeenCalledTimes(1);
    // On hard failure, service reports connected but zeroed stats
    expect(result).toEqual({ configured: true, keys: 0, memory: 'Connected', memoryBytes: 0 });

    resetSingleton();
  });
});
