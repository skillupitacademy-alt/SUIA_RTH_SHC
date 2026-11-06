import { expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createQStashHandler } from '../packages/events/src/consumer';
import { PlatformEventTypes } from '../packages/events/src/types';

const schema = z.object({ id: z.string(), type: z.literal('project.submitted') });
function request(id: string) {
  return new Request('https://fixture.invalid/events', { method: 'POST',
    headers: { 'upstash-signature': 'disposable' },
    body: JSON.stringify({ id, type: 'project.submitted' }),
  });
}
function raceFixture(id: string, replaceAfterOwnershipRead: boolean, fail = false) {
  const key = `event:skillup:project.submitted:${id}`;
  const replacement = `pending:sha256:${'b'.repeat(64)}:${id}:replacement-owner`;
  const entries = new Map<string, string>();
  let reads = 0;
  const effect = vi.fn(async () => { if (fail) throw new Error('synthetic effect failure'); });
  const handle = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
    schema, tenantScope: 'skillup', receiver: { verify: async () => true } as never,
    idempotencyStore: {
      get: k => {
        const snapshot = entries.get(k) ?? null;
        reads++;
        if (replaceAfterOwnershipRead && reads === 2) {
          // Models lease expiry/reacquisition immediately after the old owner's GET.
          entries.set(key, replacement);
        }
        return snapshot;
      },
      set: (k, value, options) => {
        if (options?.nx && entries.has(k)) return null;
        entries.set(k, value); return 'OK';
      },
      del: k => entries.delete(k),
    },
  });
  return { handle, effect, key, replacement, entries };
}

it('a supported owned claim completes and suppresses an exact sequential retry', async () => {
  const f = raceFixture('normal-owner', false);
  expect((await f.handle(request('normal-owner'))).status).toBe(200);
  expect((await f.handle(request('normal-owner'))).status).toBe(200);
  expect(f.effect).toHaveBeenCalledOnce();
});
it('completion cannot overwrite a lease replaced immediately after its ownership read', async () => {
  const f = raceFixture('completion-race', true);
  try { await f.handle(request('completion-race')); } catch { /* Retryable ownership loss allowed. */ }
  expect(f.entries.get(f.key)).toBe(f.replacement);
});
it('failure cleanup cannot delete a lease replaced immediately after its ownership read', async () => {
  const f = raceFixture('release-race', true, true);
  try { await f.handle(request('release-race')); } catch { /* Effect failure expected. */ }
  expect(f.entries.get(f.key)).toBe(f.replacement);
});
it('an unconfirmed claim is denied equally when its adapter is a test double', async () => {
  const effect = vi.fn(async () => undefined);
  const handle = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
    schema, tenantScope: 'skillup', receiver: { verify: async () => true } as never,
    idempotencyStore: { get: () => null, set: vi.fn() },
  });
  try { await handle(request('unconfirmed-test-double')); } catch { /* Unsupported-store denial allowed. */ }
  expect(effect).not.toHaveBeenCalled();
});
