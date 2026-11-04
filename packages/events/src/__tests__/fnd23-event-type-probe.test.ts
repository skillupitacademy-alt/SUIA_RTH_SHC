import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createQStashHandler } from '../consumer';
import { PlatformEventTypes } from '../types';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });
it('does not invoke a registered handler for a different custom-schema event type', async () => {
  const effect = vi.fn();
  const handler = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
    receiver: { verify: async () => true } as never,
    schema: z.object({ type: z.literal('project.approved'), correlationId: z.string(), id: z.string() }),
  });
  const response = await handler(new Request('https://isolated.invalid/', { method: 'POST', headers: { 'upstash-signature': 'fixture' }, body: JSON.stringify({ type: 'project.approved', correlationId: 'fixture', id: 'fixture' }) }));
  expect.soft(response.ok).toBe(false);
  expect.soft(effect).not.toHaveBeenCalled();
});
