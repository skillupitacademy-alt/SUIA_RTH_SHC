import { expect, it, vi } from 'vitest';
vi.mock('../../../config/analytics', () => ({ getAnalyticsRuntimeConfig: ({ brandId }: { brandId: string }) => ({ rateLimitPerMinute: 100, dedupeWindowMs: 60000, requestTimeoutMs: 1000, brand: { brandId } }) }));
vi.mock('../../event-bus/publisher', () => ({ publishEvent: vi.fn(async () => undefined) }));
import { ingestAnalyticsEvent } from '../server/pipeline';
it('keeps equal fixture event identities separate across brands and deduplicates same-brand retry', async () => {
  const body = { name: 'education.page_viewed', payload: {}, context: { brandId: 'realtutorialhub', schemaVersion: 1, user: { anonymousId: 'brand-collision-fixture', loggedInState: 'anonymous' }, session: { sessionId: 'brand-collision-session', requestId: 'fixture', occurredAt: '2026-01-01T00:00:00.000Z' }, metadata: {} } };
  const first = await ingestAnalyticsEvent({ body, ipAddress: 'fixture', brandId: 'realtutorialhub' });
  const retry = await ingestAnalyticsEvent({ body, ipAddress: 'fixture', brandId: 'realtutorialhub' });
  const other = await ingestAnalyticsEvent({ body, ipAddress: 'fixture', brandId: 'skillupitacademy' });
  expect(first.deduped).toBe(false);
  expect(retry.deduped).toBe(true);
  expect(other.deduped).toBe(false);
});
