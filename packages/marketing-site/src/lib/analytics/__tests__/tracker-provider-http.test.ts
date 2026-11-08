import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../privacy/consent-manager', () => ({ canDispatchProvider: () => true }));
vi.mock('../../../config/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../config/analytics')>();
  return {
    ...actual,
    getAnalyticsRuntimeConfig: () => ({
      enabled: true, debug: false, requestTimeoutMs: 1000, dedupeWindowMs: 1, flushIntervalMs: 60000, batchSize: 10,
      brand: { brandId: 'realtutorialhub', internalCollectionEndpoint: 'https://example.invalid/collect' },
    }),
  };
});
import { createAnalyticsTracker } from '../tracker';
import { InternalAnalyticsProvider } from '../providers/internal.provider';
import { getProviderHealthSnapshot } from '../../observability/provider-health';
import type { AnalyticsRuntimeConfig } from '../../../config/analytics';
const config = { enabled: true, requestTimeoutMs: 1000, brand: { brandId: 'realtutorialhub', internalCollectionEndpoint: 'https://example.invalid/collect' } } as AnalyticsRuntimeConfig;
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it('records a failed dispatch on 503 and no failure for 202', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(new Response(null, { status: 202 })));
  const tracker = createAnalyticsTracker('realtutorialhub', [new InternalAnalyticsProvider(config)]);
  const before = getProviderHealthSnapshot().internal?.failures ?? 0;
  tracker.trackEvent('education.page_viewed', {});
  await tracker.flush();
  expect(getProviderHealthSnapshot().internal.failures).toBe(before + 1);
  vi.advanceTimersByTime(2);
  tracker.trackEvent('education.page_viewed', { funnelId: 'second' });
  await tracker.flush();
  expect(getProviderHealthSnapshot().internal.failures).toBe(before + 1);
  expect(fetch).toHaveBeenCalledTimes(2);
});
