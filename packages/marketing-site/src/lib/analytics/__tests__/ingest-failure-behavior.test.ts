import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../../config/analytics', () => ({ getAnalyticsRuntimeConfig: () => ({ rateLimitPerMinute: 100, dedupeWindowMs: 60000, requestTimeoutMs: 1000, brand: { brandId: 'realtutorialhub', ga4MeasurementId: 'fixture', ga4MeasurementApiSecret: 'fixture' } }) }));
vi.mock('../../event-bus/publisher', () => ({ publishEvent: vi.fn(async () => undefined) }));
import { getAnalyticsDeadLetterQueue, ingestAnalyticsEvent } from '../server/pipeline';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('retains an in-memory failure and deduplicates a repeated accepted event', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fixture dispatch failure')));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const body = { name: 'education.page_viewed', payload: {}, context: { brandId: 'realtutorialhub', schemaVersion: 1, user: { anonymousId: 'fixture-anon', loggedInState: 'anonymous' }, session: { sessionId: 'fixture-session', requestId: 'fixture-request', occurredAt: '2026-01-01T00:00:00.000Z' }, metadata: {} } };
  const before = getAnalyticsDeadLetterQueue().length;
  const first = await ingestAnalyticsEvent({ body, ipAddress: 'fixture-ip', brandId: 'realtutorialhub' });
  expect(first).toMatchObject({ accepted: true, deduped: false });
  expect(getAnalyticsDeadLetterQueue()).toHaveLength(before + 1);
  const retry = await ingestAnalyticsEvent({ body, ipAddress: 'fixture-ip', brandId: 'realtutorialhub' });
  expect(retry).toMatchObject({ accepted: true, deduped: true });
  expect(fetch).toHaveBeenCalledTimes(1);
});
