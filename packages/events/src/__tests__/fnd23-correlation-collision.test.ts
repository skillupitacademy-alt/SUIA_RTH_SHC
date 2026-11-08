import { expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createInMemoryEventLeaseStore, createQStashHandler } from '../consumer';
import { PlatformEventTypes } from '../types';
it('processes distinct event IDs sharing a correlation and suppresses exact retry', async () => {
  const store = createInMemoryEventLeaseStore();
  const effect = vi.fn();
  const schema = z.object({ type: z.literal('project.submitted'), correlationId: z.string(), id: z.string() });
  const handler = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, { receiver: { verify: async () => true } as never, schema, tenantScope: 'skillup', idempotencyStore: store });
  const req = (id: string) => new Request('https://isolated.invalid', { method: 'POST', headers: { 'upstash-signature': 'fixture' }, body: JSON.stringify({ type: 'project.submitted', correlationId: 'shared', id }) });
  await handler(req('first')); await handler(req('first')); await handler(req('second'));
  expect(effect).toHaveBeenCalledTimes(2);
});
