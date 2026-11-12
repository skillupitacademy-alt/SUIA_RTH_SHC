import { queueSignatureFixture } from './queue-signature-fixture';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const transport = vi.hoisted(() => ({ publishJSON: vi.fn() }));
vi.mock('@upstash/qstash', () => ({ Client: class { publishJSON = transport.publishJSON; }, Receiver: class {} }));
import { publishEvent } from '../publisher';
import { createQStashHandler } from '../consumer';
import { PlatformEventTypes } from '../types';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); vi.stubEnv('QSTASH_TOKEN', 'isolated-fixture'); transport.publishJSON.mockReset(); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('passes a published enrolled event through its registered consumer', async () => {
  let captured: unknown;
  transport.publishJSON.mockImplementation(async (value: { body: unknown }) => { captured = value.body; return { messageId: 'fixture' }; });
  const payload = { userId: '11111111-1111-4111-8111-111111111111', domainId: '22222222-2222-4222-8222-222222222222', batchId: '33333333-3333-4333-8333-333333333333', enrollmentType: 'batch' as const, enrolledAt: '2026-01-01T00:00:00Z' };
  const published = await publishEvent(PlatformEventTypes.STUDENT_ENROLLED, payload, { destinationUrl: 'https://isolated.invalid/', source: 'fixture' });
  const handle = vi.fn();
  const consumer = createQStashHandler(PlatformEventTypes.STUDENT_ENROLLED, handle, { receiver: { verify: async () => true } as never });
  const response = await consumer(new Request('https://isolated.invalid/', { method: 'POST', headers: { 'upstash-signature': queueSignatureFixture }, body: JSON.stringify(captured) }));
  expect(response.ok).toBe(true);
  expect(handle).toHaveBeenCalledWith(expect.objectContaining({ id: published.envelope.id, version: 1, data: payload }));
});
it('rejects malformed registered event before its handler', async () => {
  const handle = vi.fn();
  const consumer = createQStashHandler(PlatformEventTypes.STUDENT_ENROLLED, handle, { receiver: { verify: async () => true } as never });
  await expect(consumer(new Request('https://isolated.invalid/', { method: 'POST', headers: { 'upstash-signature': queueSignatureFixture }, body: JSON.stringify({ type: 'student.enrolled', data: {} }) }))).rejects.toThrow();
  expect(handle).not.toHaveBeenCalled();
});
