import { describe, it, expect } from 'vitest';

import { CacheService } from '../cache.service';

const reset = () => ((CacheService as unknown as { instance?: CacheService }).instance = undefined);

describe('CacheService early guard branches', () => {
  it('returns fallback when withTimeout has redis null (line ~45)', async () => {
    reset();
    const svc = CacheService.getInstance({ redis: null } as any);
    // call private via any to exercise branch
    const result = await (svc as any).withTimeout(Promise.resolve('should-skip'), 'fallback');
    expect(result).toBe('fallback');
  });

  it('get returns null when cache miss and redis null (lines ~90-108)', async () => {
    reset();
    const svc = CacheService.getInstance({ redis: null } as any);
    (svc as any).cache = {
      get: () => undefined,
    };
    const val = await svc.get('missing-key');
    expect(val).toBeNull();
  });
});
