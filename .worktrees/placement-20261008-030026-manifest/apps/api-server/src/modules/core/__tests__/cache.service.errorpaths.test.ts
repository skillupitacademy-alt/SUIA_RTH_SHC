import { describe, it, expect } from 'vitest';

import { CacheService } from '../cache.service';

const resetSingleton = () => {
  (CacheService as unknown as { instance?: CacheService }).instance = undefined;
};

describe('CacheService error catch branches', () => {
  it('get() returns null when local cache throws', async () => {
    resetSingleton();
    const svc = CacheService.getInstance({ redis: null } as any);
    (svc as any).cache = {
      get: () => {
        throw new Error('boom-get');
      },
    };

    const result = await svc.get('k');
    expect(result).toBeNull();
  });

  it('set() swallows cache.set errors', async () => {
    resetSingleton();
    const svc = CacheService.getInstance({ redis: null } as any);
    (svc as any).cache = {
      set: () => {
        throw new Error('boom-set');
      },
    };

    await expect(svc.set('k', 'v')).resolves.toBeUndefined();
  });

  it('del() swallows cache.delete errors', async () => {
    resetSingleton();
    const svc = CacheService.getInstance({ redis: null } as any);
    (svc as any).cache = {
      delete: () => {
        throw new Error('boom-del');
      },
    };

    await expect(svc.del('k')).resolves.toBeUndefined();
  });
});
