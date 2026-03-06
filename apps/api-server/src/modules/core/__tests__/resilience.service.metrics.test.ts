import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock metrics
vi.mock('@/lib/metrics', () => ({
  recordCounter: vi.fn(),
}));

import { METRICS } from '@quiz/observability';
import { recordCounter } from '@/lib/metrics';
import { ResilienceService } from '../resilience.service';

describe('ResilienceService Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env vars that might interfere
    delete process.env.SAFE_MODE;
    delete process.env.DISABLE_ANALYTICS;
  });

  it('records metrics when safe mode is active', async () => {
    process.env.SAFE_MODE = 'true';
    await ResilienceService.isFeatureEnabled('analytics');
    expect(recordCounter).toHaveBeenCalledWith(METRICS.RESILIENCE.THROTTLE, 1, { feature: 'analytics', reason: 'safe_mode' });
  });

  it('records metrics when feature is specifically disabled', async () => {
    process.env.DISABLE_ANALYTICS = 'true';
    await ResilienceService.isFeatureEnabled('analytics');
    expect(recordCounter).toHaveBeenCalledWith(METRICS.RESILIENCE.THROTTLE, 1, { feature: 'analytics', reason: 'env_toggle' });
  });
});
