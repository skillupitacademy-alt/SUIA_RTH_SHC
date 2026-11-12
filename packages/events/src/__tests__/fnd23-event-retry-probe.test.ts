import { queueSignatureFixture } from './queue-signature-fixture';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createInMemoryEventLeaseStore, createQStashHandler } from '../consumer';
import { PlatformEventTypes } from '../types';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });
const body = JSON.stringify({ type: 'project.submitted', correlationId: 'correlation', id: 'event' });
const schema = z.object({ type: z.literal('project.submitted'), correlationId: z.string(), id: z.string() });
const request = () => new Request('https://isolated.invalid/', { method: 'POST', headers: { 'upstash-signature': queueSignatureFixture }, body });
function store() {
  return createInMemoryEventLeaseStore();
}
it('retries an event after handler failure instead of acknowledging it as complete', async () => {
  const effect = vi.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValueOnce(undefined);
  const handler = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, { receiver: { verify: async () => true } as never, schema, tenantScope: 'skillup', idempotencyStore: store() });
  await expect(handler(request())).rejects.toThrow('failed');
  await handler(request());
  expect(effect).toHaveBeenCalledTimes(2);
});
it('suppresses a sequential duplicate after a successful handler', async () => {
  const effect = vi.fn();
  const handler = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, { receiver: { verify: async () => true } as never, schema, tenantScope: 'skillup', idempotencyStore: store() });
  expect((await handler(request())).ok).toBe(true);
  expect((await handler(request())).ok).toBe(true);
  expect(effect).toHaveBeenCalledOnce();
});
