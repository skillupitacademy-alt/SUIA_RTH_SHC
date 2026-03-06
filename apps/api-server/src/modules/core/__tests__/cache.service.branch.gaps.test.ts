import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from '@/lib/logger';

import { CacheService } from '../cache.service';

describe('CacheService branch gaps', () => {
  const oldNodeEnv = process.env.NODE_ENV;
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = 'test';
    (logger as any).trace = vi.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = oldNodeEnv;
  });

  it('logs both MISS and HIT traces when debug is enabled', async () => {
    process.env.DEBUG_CACHE = 'true';

    const service = new (CacheService as any)({ redis: null }) as CacheService;

    await expect(service.get('k1')).resolves.toBeNull();
    await service.set('k1', { ok: true }, 1000);
    await expect(service.get('k1')).resolves.toEqual({ ok: true });
  });

  it('uses redis.set without px when ttl is undefined', async () => {
    const redis = {
      set: vi.fn().mockResolvedValue('OK'),
    };

    const service = new (CacheService as any)({ redis }) as CacheService;
    await service.set('k-no-ttl', { value: 1 });

    expect(redis.set).toHaveBeenCalledWith('k-no-ttl', { value: 1 });
  });
});
