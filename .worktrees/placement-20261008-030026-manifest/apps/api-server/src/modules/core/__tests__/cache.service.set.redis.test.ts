import { describe, expect, it, vi } from 'vitest';

import { CacheService } from '../cache.service';

describe('CacheService set Redis branches', () => {
  it('uses px option when ttl is provided', async () => {
    const redis = { set: vi.fn().mockResolvedValue('OK') } as any;
    (CacheService as any).instance = undefined;
    const service: any = CacheService.getInstance({ redis });

    await service.set('k1', { a: 1 }, 1234);
    expect(redis.set).toHaveBeenCalledWith('k1', { a: 1 }, { px: 1234 });
  });

  it('uses plain set when ttl is not provided', async () => {
    const redis = { set: vi.fn().mockResolvedValue('OK') } as any;
    (CacheService as any).instance = undefined;
    const service: any = CacheService.getInstance({ redis });

    await service.set('k2', 1);
    expect(redis.set).toHaveBeenCalledWith('k2', 1);
  });
});
