import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => vi.unstubAllEnvs());
const captured = vi.hoisted(() => ({ bodies: [] as unknown[] }));
vi.mock('@upstash/qstash', () => ({
  Receiver: class {},
  Client: class {
    async publishJSON(input: { body: unknown }) {
      captured.bodies.push(input.body);
      return { messageId: 'disposable-message' };
    }
  },
}));
import { publishEvent } from '../packages/events/src/publisher';
import { createInMemoryEventLeaseStore, createQStashHandler } from '../packages/events/src/consumer';
import { PlatformEventTypes } from '../packages/events/src/types';

it('republication with a stable event ID remains an exact duplicate for the real consumer', async () => {
  vi.stubEnv('QSTASH_TOKEN', 'disposable-offline-token');
  const eventId = '10000000-0000-4000-8000-000000000001';
  const payload = {
    certificateId: '20000000-0000-4000-8000-000000000002',
    userId: '30000000-0000-4000-8000-000000000003',
    issuedAt: '2026-11-07T00:00:00.000Z',
  };
  const effect = vi.fn();
  const consume = createQStashHandler(PlatformEventTypes.CERTIFICATE_ISSUED, effect, {
    receiver: { verify: async () => true } as never,
    tenantScope: 'realtutorialhub', idempotencyStore: createInMemoryEventLeaseStore(),
  });
  const options = { id: eventId, tenantId: 'realtutorialhub', destinationUrl: 'https://fixture.invalid/events' };
  await publishEvent(PlatformEventTypes.CERTIFICATE_ISSUED, payload, options);
  await publishEvent(PlatformEventTypes.CERTIFICATE_ISSUED, payload, options);
  const request = (body: unknown) => new Request('https://fixture.invalid/events', {
    method: 'POST', headers: { 'upstash-signature': 'disposable-signature' }, body: JSON.stringify(body),
  });
  expect((await consume(request(captured.bodies[0]))).status).toBe(200);
  expect((await consume(request(captured.bodies[1]))).status).toBe(200);
  expect(effect).toHaveBeenCalledOnce();
});
