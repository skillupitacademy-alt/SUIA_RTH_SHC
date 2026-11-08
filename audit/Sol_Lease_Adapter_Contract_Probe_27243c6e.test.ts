import { expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createDurableEventLeaseStore, createQStashHandler, PlatformEventTypes } from '../packages/events/src';
import { acquireWorkerLease, completeWorkerLeaseIfOwner, releaseWorkerLeaseIfOwner } from '../apps/realtutorialhub-web/src/app/api/workers/worker-lease';

function replacementAfterFinalRead() {
  const entries = new Map([['lease', 'processing:old-owner']]);
  let reads = 0;
  const redis = {
    get: (key: string) => {
      const snapshot = entries.get(key) ?? null;
      if (++reads === 2) entries.set(key, 'processing:replacement-owner');
      return snapshot;
    },
    set: (key: string, value: string, options?: { nx?: boolean }) => {
      if (options?.nx && entries.has(key)) return null;
      entries.set(key, value); return 'OK';
    },
    del: (key: string) => entries.delete(key),
  };
  return { redis, entries };
}

for (const target of ['generic', 'worker'] as const) {
  for (const action of ['complete', 'release'] as const) {
    it(`${target} ${action} preserves a replacement after the final comparison read`, async () => {
      const { redis, entries } = replacementAfterFinalRead();
      try {
        if (target === 'generic') {
          const store = createDurableEventLeaseStore(redis);
          if (action === 'complete') await store.completeIfOwner({ key: 'lease', expectedPending: 'processing:old-owner', completedValue: 'processed', retentionSeconds: 60 });
          else await store.releaseIfOwner({ key: 'lease', expectedPending: 'processing:old-owner' });
        } else if (action === 'complete') {
          await completeWorkerLeaseIfOwner(redis, 'lease', 'processing:old-owner', 'processed', 60);
        } else {
          await releaseWorkerLeaseIfOwner(redis, 'lease', 'processing:old-owner');
        }
      } catch { /* Rejecting a non-atomic adapter is an acceptable outcome. */ }
      expect(entries.get('lease')).not.toBe('processed');
      expect(entries.has('lease')).toBe(true);
      // With no adapter support, no mutation is allowed; otherwise preserve replacement.
      expect(['processing:old-owner', 'processing:replacement-owner']).toContain(entries.get('lease'));
    });
  }
}

it('generic handler rejects a non-atomic completion adapter before business effects', async () => {
  const effect = vi.fn();
  const { redis } = replacementAfterFinalRead();
  const handler = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
    schema: z.object({ id: z.string(), type: z.literal('project.submitted') }),
    tenantScope: 'skillup', receiver: { verify: async () => true } as never,
    idempotencyStore: redis,
  });
  try {
    await handler(new Request('https://fixture.invalid/events', { method: 'POST', headers: { 'upstash-signature': 'fixture' }, body: JSON.stringify({ id: 'new-event', type: 'project.submitted' }) }));
  } catch { /* Unsupported-store rejection expected. */ }
  expect(effect).not.toHaveBeenCalled();
});

it('worker does not acquire an effect lease without atomic completion/release support', async () => {
  const { redis } = replacementAfterFinalRead();
  let acquired = false;
  try { acquired = (await acquireWorkerLease(redis, 'new-worker-lease', { leaseSeconds: 60 })).kind === 'acquired'; }
  catch { /* Unsupported-store rejection expected. */ }
  expect(acquired).toBe(false);
});

it('supported Redis adapter completes using one owner-conditional operation', async () => {
  const evalOperation = vi.fn(async (_script: string, _keys: string[], _args: Array<string | number>) => 1);
  const get = vi.fn();
  const set = vi.fn();
  const store = createDurableEventLeaseStore({ get, set, eval: evalOperation });
  expect(await store.completeIfOwner({ key: 'lease', expectedPending: 'pending:owner', completedValue: 'completed:digest', retentionSeconds: 60 })).toBe('applied');
  expect(evalOperation).toHaveBeenCalledOnce();
  expect(evalOperation.mock.calls[0]?.[1]).toEqual(['lease']);
  expect(evalOperation.mock.calls[0]?.[2]).toEqual(['pending:owner', 'completed:digest', 60]);
  expect(get).not.toHaveBeenCalled();
  expect(set).not.toHaveBeenCalled();
});
