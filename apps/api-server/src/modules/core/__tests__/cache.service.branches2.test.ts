import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { logger } from '@/lib/logger';

const originalEnv = { ...process.env };

describe('CacheService init / debug branches', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('logs and survives Redis constructor failure on init', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://u';
    process.env.UPSTASH_REDIS_REST_TOKEN = 't';
    process.env.NODE_ENV = 'test';

    vi.doMock('@upstash/redis', () => ({
      Redis: class {
        constructor() {
          throw new Error('boom');
        }
      },
    }));

    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const { CacheService } = await import('../cache.service');
    (CacheService as any).instance = undefined;

    CacheService.getInstance();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('debug() logs when DEBUG_CACHE is enabled', async () => {
    process.env.DEBUG_CACHE = 'true';
    process.env.NODE_ENV = 'test';

    const { CacheService } = await import('../cache.service');
    (CacheService as any).instance = undefined;
    const inst = CacheService.getInstance();
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

    // @ts-expect-error accessing private for coverage
    inst.debug('op', 'k');

    expect(debugSpy).toHaveBeenCalledWith({ op: 'op', key: 'k' }, '[Cache] debug');
  });

  it('generateKey produces stable sorted hash', async () => {
    process.env.NODE_ENV = 'test';
    const { CacheService } = await import('../cache.service');
    (CacheService as any).instance = undefined;
    const inst = CacheService.getInstance();

    const key = inst.generateKey('p', { b: 2, a: 1 });
    expect(key).toBe('p:{"a":1,"b":2}');
  });
});
