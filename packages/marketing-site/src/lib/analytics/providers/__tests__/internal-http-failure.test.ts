import { afterEach, expect, it, vi } from 'vitest';
import { InternalAnalyticsProvider } from '../internal.provider';
import type { AnalyticsRuntimeConfig } from '../../../../config/analytics';
import type { AnalyticsEventEnvelope } from '../../events';

const config = {
  enabled: true, requestTimeoutMs: 1000,
  brand: { brandId: 'realtutorialhub', internalCollectionEndpoint: 'https://example.invalid/collect' },
} as AnalyticsRuntimeConfig;
const event = { name: 'education.page_viewed', payload: {}, context: {} } as AnalyticsEventEnvelope;
afterEach(() => vi.unstubAllGlobals());
it('resolves on an accepted response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202 })));
  await expect(new InternalAnalyticsProvider(config).track(event)).resolves.toBeUndefined();
});
it('propagates a rejected transport', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  await expect(new InternalAnalyticsProvider(config).track(event)).rejects.toThrow('offline');
});
it('does not report an HTTP 503 as successful dispatch', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
  await expect(new InternalAnalyticsProvider(config).track(event)).rejects.toThrow();
});

