import { expect, it, vi } from 'vitest';
import { z } from 'zod';
vi.mock('@quiz/db', () => ({ withTimeout: (p: Promise<unknown>) => p, STANDARD_QUERY_TIMEOUT: 1000, REPORT_QUERY_TIMEOUT: 1000 }));
vi.mock('../packages/db-tutorial/src/db', () => ({ db: {} }));
import { createQStashHandler } from '../packages/events/src/consumer';
import { PlatformEventTypes } from '../packages/events/src/types';
import { TutorialProgressRepository } from '../packages/db-tutorial/src/repositories/tutorial-progress.repository';
import { resolveStoredExamBrand, resolveStoredJobBrand } from '../apps/api-server/src/lib/export/exportTypes';

const schema = z.object({ id: z.string(), type: z.literal('project.submitted'), source: z.string() });
const request = (id: string, source = 'application-service') => new Request('https://fixture.invalid/events', {
  method: 'POST', headers: { 'upstash-signature': 'disposable' },
  body: JSON.stringify({ id, type: 'project.submitted', source }),
});

it('a failed atomic claim must not execute the handler or write completion', async () => {
  const effect = vi.fn(async () => undefined), set = vi.fn(async () => null);
  const handle = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
    schema, tenantScope: 'skillup', receiver: { verify: async () => true } as never,
    idempotencyStore: { get: () => null, set },
  });
  try { await handle(request('lost-claim')); } catch { /* Retryable denial permitted. */ }
  expect(effect).not.toHaveBeenCalled();
  expect(set).toHaveBeenCalledTimes(1);
});

it('an expired lease holder must not overwrite a replacement claim', async () => {
  const key = 'event:skillup:project.submitted:expired-owner';
  const replacement = `pending:sha256:${'a'.repeat(64)}:replacement-delivery`;
  const entries = new Map<string, string>();
  const handle = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, async () => {
    // Another worker has acquired a replacement lease while this delivery was running.
    entries.set(key, replacement);
  }, {
    schema, tenantScope: 'skillup', receiver: { verify: async () => true } as never,
    idempotencyStore: {
      get: k => entries.get(k) ?? null,
      set: (k, value) => { entries.set(k, value); return 'OK'; },
    },
  });
  try { await handle(request('expired-owner')); } catch { /* Ownership loss may be reported. */ }
  expect(entries.get(key)).toBe(replacement);
});

it('a canonical-looking source label alone is not verified tenant authority', async () => {
  const effect = vi.fn(async () => undefined);
  const handle = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
    schema, receiver: { verify: async () => true } as never,
  });
  try { await handle(request('source-only', 'skillup')); } catch { /* Pre-effect denial permitted. */ }
  expect(effect).not.toHaveBeenCalled();
});

it('progress never acknowledges an unapplied completion after repeated CAS conflicts', async () => {
  const row = { id: 'row-cas', userId: 'user', subtopicId: 'topic', tenantId: 'skillup',
    blocksCompleted: ['notes'], status: 'in_progress', version: 2 };
  const writes = vi.fn(async () => []);
  const db = {
    select: () => ({ from: () => ({ where: async () => [{ ...row, blocksCompleted: [...row.blocksCompleted] }] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: writes }) }) }),
  };
  const repository = new TutorialProgressRepository(db as never);
  let returned: { blocksCompleted: string[] } | undefined;
  try { returned = await repository.markBlockComplete('user', 'topic', 'technical', 'skillup'); }
  catch { /* An explicit retryable conflict is valid; silent successful loss is not. */ }
  expect(writes).toHaveBeenCalled();
  if (returned) expect(returned.blocksCompleted).toContain('technical');
});

it('export provenance retains a valid explicit stored tenant', () => {
  expect(resolveStoredExamBrand({ brand: 'skillup' })).toBe('skillup');
  expect(resolveStoredJobBrand({ payload: { brand: 'skillup' } })).toBe('skillup');
});
it('an artifact filename alone must not establish exam or job tenant authority', () => {
  expect.soft(resolveStoredExamBrand({ exportUrls: { analytics_json: 'exports/skillup/user/exam/report.json' } })).toBeUndefined();
  expect.soft(resolveStoredJobBrand({ result: { downloadUrl: 'exports/skillup/user/exam/report.json' } })).toBeUndefined();
});
it('conflicting explicit stored tenant fields fail closed instead of choosing the first', () => {
  expect.soft(resolveStoredExamBrand({ brand: 'skillup', tenantId: 'realtutorialhub' })).toBeUndefined();
  expect.soft(resolveStoredJobBrand({ brand: 'skillup', payload: { brand: 'realtutorialhub' } })).toBeUndefined();
});
