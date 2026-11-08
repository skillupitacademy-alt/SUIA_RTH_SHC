import { expect, it, vi } from 'vitest';
vi.mock('../../../config/analytics', () => ({
  getAnalyticsRuntimeConfig: ({ brandId }: { brandId: string }) => ({
    rateLimitPerMinute: 100,
    dedupeWindowMs: 60000,
    requestTimeoutMs: 1000,
    brand: { brandId },
  }),
}));
vi.mock('../../event-bus/publisher', () => ({ publishEvent: vi.fn(async () => undefined) }));
import { ingestAnalyticsEvent } from '../server/pipeline';

it('keeps equal fixture event identities separate across brands and deduplicates same-brand retry', async () => {
  const body = {
    name: 'education.page_viewed',
    payload: {},
    context: {
      brandId: 'realtutorialhub',
      schemaVersion: 1,
      user: { anonymousId: 'brand-collision-fixture', loggedInState: 'anonymous' },
      session: { sessionId: 'brand-collision-session', requestId: 'fixture', occurredAt: '2026-01-01T00:00:00.000Z' },
      metadata: {},
    },
  };
  const first = await ingestAnalyticsEvent({ body, ipAddress: 'fixture', brandId: 'realtutorialhub' });
  const retry = await ingestAnalyticsEvent({ body, ipAddress: 'fixture', brandId: 'realtutorialhub' });
  const other = await ingestAnalyticsEvent({ body, ipAddress: 'fixture', brandId: 'skillupitacademy' });
  expect(first.deduped).toBe(false);
  expect(retry.deduped).toBe(true);
  expect(other.deduped).toBe(false);
});

it('FAIL-04 regression: isolates session timeline and lead scoring across brands for colliding session and anonymous IDs', async () => {
  // Brand 1: realtutorialhub initial event
  const rthBody = {
    name: 'education.page_viewed',
    payload: {},
    context: {
      brandId: 'realtutorialhub',
      schemaVersion: 1,
      user: { anonymousId: 'collision-anon-user', loggedInState: 'anonymous' },
      session: { sessionId: 'collision-session-id', requestId: 'req-rth-1', occurredAt: '2026-01-01T00:00:00.000Z' },
      metadata: {},
    },
  };

  // Capture console.info logs to inspect warehouse dispatch payload
  const logSpy = vi.spyOn(console, 'info');

  await ingestAnalyticsEvent({ body: rthBody, ipAddress: 'fixture-ip', brandId: 'realtutorialhub' });

  const rthLogCall = logSpy.mock.calls.find((call) => call[0] === '[analytics:warehouse]' && call[1]?.brandId === 'realtutorialhub');
  expect(rthLogCall).toBeDefined();
  const rthSnapshot = rthLogCall![1].sessionSnapshot;
  const rthLeadScore = rthLogCall![1].leadScore;

  expect(rthSnapshot.sessionDepth).toBe(1);
  expect(rthLeadScore).toBe(2);

  // Brand 2: skillupitacademy event with colliding sessionId and anonymousId
  const suiaBody = {
    name: 'education.page_viewed',
    payload: {},
    context: {
      brandId: 'skillupitacademy',
      schemaVersion: 1,
      user: { anonymousId: 'collision-anon-user', loggedInState: 'anonymous' },
      session: { sessionId: 'collision-session-id', requestId: 'req-suia-1', occurredAt: '2026-01-01T00:00:01.000Z' },
      metadata: {},
    },
  };

  await ingestAnalyticsEvent({ body: suiaBody, ipAddress: 'fixture-ip', brandId: 'skillupitacademy' });

  const suiaLogCall = logSpy.mock.calls.find((call) => call[0] === '[analytics:warehouse]' && call[1]?.brandId === 'skillupitacademy');
  expect(suiaLogCall).toBeDefined();
  const suiaSnapshot = suiaLogCall![1].sessionSnapshot;
  const suiaLeadScore = suiaLogCall![1].leadScore;

  // Strict cross-brand isolation assertion:
  // A brand-isolated pipeline must start SkillUp's sessionDepth at 1 and leadScore at 2,
  // NOT accumulate into 2 and 4 from RealTutorialHub's prior event.
  expect(suiaSnapshot.sessionDepth).toBe(1);
  expect(suiaLeadScore).toBe(2);

  logSpy.mockRestore();
});
