import { expect, it, vi } from 'vitest';
import { z } from 'zod';
vi.mock('@quiz/db', () => ({ withTimeout: (p: Promise<unknown>) => p, STANDARD_QUERY_TIMEOUT: 1000, REPORT_QUERY_TIMEOUT: 1000 }));
vi.mock('../packages/db-tutorial/src/db', () => ({ db: {} }));
import { createQStashHandler } from '../packages/events/src/consumer';
import { PlatformEventTypes } from '../packages/events/src/types';
import { TutorialProgressRepository } from '../packages/db-tutorial/src/repositories/tutorial-progress.repository';
import { TutorialDocumentSchema } from '../packages/types/src/tutorial-rich-document/schemas/document.schema';

const eventSchema = z.object({ id: z.string(), type: z.literal('project.submitted'), source: z.string(), data: z.object({ value: z.number() }) });
function request(value = 1) {
  return new Request('https://fixture.invalid/events', { method: 'POST', headers: { 'upstash-signature': 'disposable' },
    body: JSON.stringify({ id: 'fixed-event', type: 'project.submitted', source: 'application-service', data: { value } }) });
}
function consumer(effect: () => Promise<void>, entries = new Map<string, string>()) {
  return createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
    schema: eventSchema, receiver: { verify: async () => true } as never,
    tenantScope: 'skillup', idempotencyStore: {
      get: key => entries.get(key) ?? null,
      set: (key, value) => { entries.set(key, value); return 'OK'; },
    },
  });
}
it('events preserve exact sequential replay without another effect', async () => {
  const effect = vi.fn(async () => undefined), handle = consumer(effect);
  expect((await handle(request())).status).toBe(200);
  expect((await handle(request())).status).toBe(200);
  expect(effect).toHaveBeenCalledOnce();
});
it('events reject changed payload under a completed identity with 409', async () => {
  const effect = vi.fn(async () => undefined), handle = consumer(effect);
  await handle(request(1));
  expect((await handle(request(2))).status).toBe(409);
  expect(effect).toHaveBeenCalledOnce();
});
it('events atomically admit only one concurrent handler for the same identity', async () => {
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  const effect = vi.fn(async () => { await gate; }), handle = consumer(effect);
  const first = handle(request()), second = handle(request());
  await new Promise(r => setTimeout(r, 10));
  release(); await Promise.all([first, second]);
  expect(effect).toHaveBeenCalledOnce();
});
it('events do not acknowledge an in-flight claim as a completed duplicate', async () => {
  const entries = new Map([['event:skillup:project.submitted:fixed-event', 'pending:fnv1a:00000000:fixed-event']]);
  const effect = vi.fn(async () => undefined), handle = consumer(effect, entries);
  expect((await handle(request())).status).not.toBe(200);
  expect(effect).not.toHaveBeenCalled();
});
it('events reject unresolved tenant authority rather than using the source label as tenant', async () => {
  const effect = vi.fn(async () => undefined);
  const handle = createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
    schema: eventSchema, receiver: { verify: async () => true } as never,
  });
  try { await handle(request()); } catch { /* Explicit pre-effect denial is acceptable. */ }
  expect(effect).not.toHaveBeenCalled();
});

function progressFixture() {
  let row: any = { id: 'row-1', tenantId: 'skillup', userId: 'user', subtopicId: 'topic', blocksCompleted: ['notes'], status: 'in_progress', version: 1 };
  let reads = 0, bothRead!: () => void;
  const readGate = new Promise<void>(r => { bothRead = r; });
  const select = vi.fn(() => ({ from: () => ({ where: async () => {
    const snapshot = { ...row, blocksCompleted: [...row.blocksCompleted] };
    reads++; if (reads === 2) bothRead();
    return [snapshot];
  } }) }));
  const db = { select, update: () => ({ set: (values: any) => ({ where: () => ({ returning: async () => {
    await readGate; row = { ...row, ...values }; return [row];
  } }) }) }) };
  return { db, select, row: () => row };
}
it('progress rejects missing tenant before selecting private rows', async () => {
  const f = progressFixture(), repository = new TutorialProgressRepository(f.db as never);
  try { await repository.getProgress('user', 'topic'); } catch { /* Explicit denial is allowed. */ }
  expect(f.select).not.toHaveBeenCalled();
});
it('progress retains concurrent completions across independent repository instances', async () => {
  const f = progressFixture(), a = new TutorialProgressRepository(f.db as never), b = new TutorialProgressRepository(f.db as never);
  await Promise.all([a.markBlockComplete('user', 'topic', 'technical', 'skillup'), b.markBlockComplete('user', 'topic', 'code', 'skillup')]);
  expect(f.row().blocksCompleted).toEqual(expect.arrayContaining(['technical', 'code']));
});
it('document parser rejects an in-memory cycle without overflowing its stack', () => {
  const block: any = { id: 'cycle-root', type: 'two-column', content: { left: { blocks: [] }, right: { blocks: [] } } };
  block.content.left.blocks.push(block);
  let parsed: { success: boolean } | undefined;
  expect(() => { parsed = TutorialDocumentSchema.safeParse({ schemaVersion: 1, blocks: [block] }); }).not.toThrow();
  expect(parsed?.success).toBe(false);
});
