import { describe, it, expect } from 'vitest';

import { CacheService } from '../cache.service';

const resetSingleton = () => {
  (CacheService as unknown as { instance?: CacheService }).instance = undefined;
};

describe('CacheService local hit branches', () => {
  it('returns cached value and skips redis', async () => {
    resetSingleton();
    const svc = CacheService.getInstance({ redis: null } as any);

    // inject local cache with a preset value
    (svc as any).cache = {
      get: (key: string) => (key === 'foo' ? 'bar' : undefined),
      set: () => {
        throw new Error('should not be called');
      },
    };

    const result = await svc.get('foo');

    expect(result).toBe('bar');
  });

  it('returns null on miss with no redis configured', async () => {
    resetSingleton();
    const svc = CacheService.getInstance({ redis: null } as any);
    (svc as any).cache = {
      get: () => undefined,
    };

    const result = await svc.get('missing');
    expect(result).toBeNull();
  });
});
