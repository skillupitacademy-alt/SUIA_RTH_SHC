import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { SignJWT } from 'jose';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  main: undefined as unknown,
  tutorial: undefined as unknown,
  unavailable: false,
  rollbackTutorial: false,
  failMainCompletion: false,
  beforeTutorialCommit: undefined as (() => Promise<void>) | undefined,
  afterTutorialCommit: undefined as (() => Promise<void>) | undefined,
}));
vi.mock('@quiz/db', async importOriginal => ({
  ...await importOriginal<typeof import('@quiz/db')>(),
  getDb: () => state.main,
  db: new Proxy({}, { get: (_target, key) => Reflect.get(state.main as object, key) }),
}));
vi.mock('@quiz/db-tutorial', async importOriginal => ({
  ...await importOriginal<typeof import('@quiz/db-tutorial')>(),
  db: new Proxy({}, { get: (_target, key) => {
    if (state.unavailable) throw new Error('R5 isolated transport outage');
    return Reflect.get(state.tutorial as object, key);
  } }),
}));
import * as mainSchema from '@quiz/db';
import * as mainRelations from '../../../../../../packages/db/src/schema/relations';
import * as tutorialSchema from '@quiz/db-tutorial';
import { HierarchySyncService, type ReconciliationEntity } from '../hierarchy-sync.service';

// Explicit opt-in. Every write and cleanup below is confined to generated UUIDs.
describe.skipIf(process.env.RUN_HIERARCHY_REMOTE_UAT !== '1')('R5 real current-state hierarchy reconciliation', () => {
  const tag = `r5-reconcile-${randomUUID()}`;
  const owned = { domain: [] as string[], subject: [] as string[], topic: [] as string[], subtopic: [] as string[] };
  const tables = { domain: 'domains', subject: 'subjects', topic: 'topics', subtopic: 'subtopics' };
  const targetTables = { domain: 'tutorial_domains', subject: 'tutorial_subjects', topic: 'tutorial_topics', subtopic: 'tutorial_subtopics' };
  const observations: Array<{ scenario: string; passed: boolean }> = [];
  let main: Pool;
  let tutorial: Pool;
  let workerEnvironment: Record<string, string>;
  beforeAll(async () => {
    neonConfig.webSocketConstructor = WebSocket;
    const env = parse(readFileSync(path.resolve('../../.env.local')));
    workerEnvironment = { ...env, ...parse(readFileSync(path.resolve('.env.local'))) };
    main = new Pool({ connectionString: env.DATABASE_URL, max: 4, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
    tutorial = new Pool({ connectionString: env.DATABASE_DIRECT_URL_TUTORIAL || env.DATABASE_URL_TUTORIAL, max: 3, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
    const mainDb = drizzle(main, { schema: { ...mainSchema, ...mainRelations } });
    const tutorialDb = drizzle(tutorial, { schema: tutorialSchema });
    state.main = {
      query: mainDb.query, select: mainDb.select.bind(mainDb),
      transaction: <T>(operation: Parameters<typeof mainDb.transaction<T>>[0]) => mainDb.transaction(async tx => {
        const result = await operation(tx);
        if (state.failMainCompletion) throw new Error('R5 isolated MainDB completion fault');
        return result;
      }),
    };
    state.tutorial = {
      query: tutorialDb.query,
      transaction: async <T>(operation: Parameters<typeof tutorialDb.transaction<T>>[0]) => {
        const result = await tutorialDb.transaction(async tx => {
          const value = await operation(tx);
          await state.beforeTutorialCommit?.();
          if (state.rollbackTutorial) throw new Error('R5 isolated pre-commit rollback');
          return value;
        });
        await state.afterTutorialCommit?.();
        return result;
      },
    };
  });
  async function hierarchy(child = true) {
    const domain = randomUUID(); const subject = randomUUID(); const topic = randomUUID(); const subtopic = randomUUID();
    owned.domain.push(domain); owned.subject.push(subject); owned.topic.push(topic);
    if (child) owned.subtopic.push(subtopic);
    await main.query('INSERT INTO domains(id,name) VALUES($1,$2)', [domain, `${tag}-${domain}`]);
    await main.query('INSERT INTO subjects(id,domain_id,name) VALUES($1,$2,$3)', [subject, domain, `${tag}-${subject}`]);
    await main.query('INSERT INTO topics(id,subject_id,name) VALUES($1,$2,$3)', [topic, subject, `${tag}-${topic}`]);
    if (child) await main.query('INSERT INTO subtopics(id,topic_id,name) VALUES($1,$2,$3)', [subtopic, topic, `${tag}-${subtopic}`]);
    return { domain, subject, topic, subtopic };
  }
  const entity = (entityType: ReconciliationEntity['entityType'], entityId: string): ReconciliationEntity => ({ entityType, entityId });
  async function reconcile(entityType: ReconciliationEntity['entityType'], entityId: string) {
    return HierarchySyncService.retryFailed({ entities: [entity(entityType, entityId)] });
  }
  async function mapping(entityType: keyof typeof targetTables, externalId: string) {
    return (await tutorial.query(`SELECT * FROM ${targetTables[entityType]} WHERE external_id=$1`, [externalId])).rows[0];
  }
  function passed(scenario: string) { observations.push({ scenario, passed: true }); }
  afterAll(async () => {
    state.unavailable = false; state.rollbackTutorial = false; state.failMainCompletion = false;
    state.afterTutorialCommit = undefined;
    state.beforeTutorialCommit = undefined;
    let cleanupVerified = false;
    try {
      for (const kind of ['subtopic', 'topic', 'subject', 'domain'] as const) {
        await tutorial.query(`DELETE FROM ${targetTables[kind]} WHERE external_id=ANY($1::uuid[])`, [owned[kind]]);
        await main.query(`DELETE FROM ${tables[kind]} WHERE id=ANY($1::uuid[])`, [owned[kind]]);
      }
      const counts = await Promise.all((Object.keys(tables) as Array<keyof typeof tables>).flatMap(kind => [
        main.query(`SELECT count(*)::int AS n FROM ${tables[kind]} WHERE id=ANY($1::uuid[])`, [owned[kind]]),
        tutorial.query(`SELECT count(*)::int AS n FROM ${targetTables[kind]} WHERE external_id=ANY($1::uuid[])`, [owned[kind]]),
      ]));
      cleanupVerified = counts.every(result => result.rows[0].n === 0);
      expect(cleanupVerified).toBe(true);
    } finally {
      await Promise.all([main.end(), tutorial.end()]);
      writeFileSync(path.resolve('../../.evidence/r5-existing-p1/hierarchy-remote-results.json'), JSON.stringify({
        boundary: 'Actual existing HierarchySyncService and MainDB lock helper against real remote PostgreSQL transactions. Provider injection selects connections and explicit transport/transaction faults. Exact run-owned UUIDs only. No schema changes or blanket reconciliation.', tag, observations, cleanupVerified,
      }, null, 2));
    }
  });
  it('detects and repairs a missing domain mapping after the real commit', async () => {
    const h = await hierarchy();
    expect(await mapping('domain', h.domain)).toBeUndefined();
    expect(await reconcile('domain', h.domain)).toMatchObject({ checked: 1, repaired: 1, complete: true });
    expect((await mapping('domain', h.domain)).external_id).toBe(h.domain);
    passed('missing domain repaired and post-commit observed');
  });
  it('repairs a missing complete parent chain and makes a second run a true no-op', async () => {
    const h = await hierarchy();
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ repaired: 1, complete: true });
    const before = await Promise.all((['domain', 'subject', 'topic', 'subtopic'] as const).map(kind => mapping(kind, h[kind])));
    expect(before[1].domain_id).toBe(before[0].id);
    expect(before[2].subject_id).toBe(before[1].id);
    expect(before[3].topic_id).toBe(before[2].id);
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ checked: 1, repaired: 0, alreadyConsistent: 1, complete: true });
    const after = await Promise.all((['domain', 'subject', 'topic', 'subtopic'] as const).map(kind => mapping(kind, h[kind])));
    expect(after).toEqual(before);
    passed('complete chain repair and idempotent unchanged timestamps');
  });
  it('repairs a stale name and wrong parent while retaining existing URL and difficulty data', async () => {
    const h = await hierarchy(); const other = await hierarchy();
    await reconcile('subtopic', h.subtopic); await reconcile('subject', other.subject);
    const original = await mapping('topic', h.topic); const otherParent = await mapping('subject', other.subject);
    await tutorial.query('UPDATE tutorial_topics SET name=$1,subject_id=$2,slug=$3 WHERE external_id=$4', ['stale', otherParent.id, `${tag}-stable-url`, h.topic]);
    await tutorial.query('UPDATE tutorial_subtopics SET difficulty_levels=$1 WHERE external_id=$2', [JSON.stringify(['beginner']), h.subtopic]);
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ repaired: 1, complete: true });
    const repaired = await mapping('topic', h.topic);
    expect(repaired.id).toBe(original.id);
    expect(repaired.subject_id).toBe((await mapping('subject', h.subject)).id);
    expect(repaired.name).toBe(`${tag}-${h.topic}`);
    expect(repaired.slug).toBe(`${tag}-stable-url`);
    expect((await mapping('subtopic', h.subtopic)).difficulty_levels).toEqual(['beginner']);
    passed('stale canonical name and wrong parent fixed with identity retention');
  });
  it('does not synchronize a current inactive source or resurrect a deleted source', async () => {
    const h = await hierarchy();
    await main.query("UPDATE topics SET status='inactive' WHERE id=$1", [h.topic]);
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ skipped: 1, repaired: 0 });
    expect(await mapping('domain', h.domain)).toBeUndefined();
    await main.query('UPDATE topics SET deleted_at=now() WHERE id=$1', [h.topic]);
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ complete: false, failed: 1 });
    expect(await mapping('subtopic', h.subtopic)).toBeUndefined();
    passed('inactive and soft-deleted MainDB sources excluded');
  });
  it('fails closed for a deliberately retained deleted TutorialDB mapping', async () => {
    const h = await hierarchy(); await reconcile('topic', h.topic);
    await tutorial.query('UPDATE tutorial_topics SET deleted_at=now() WHERE external_id=$1', [h.topic]);
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ complete: false, failed: 1, repaired: 0 });
    expect((await mapping('topic', h.topic)).deleted_at).not.toBeNull();
    expect(await mapping('subtopic', h.subtopic)).toBeUndefined();
    passed('retained deleted TutorialDB mapping stays deleted');
  });
  it('reports an unavailable TutorialDB and subsequently rediscovers and repairs drift', async () => {
    const h = await hierarchy(); state.unavailable = true;
    try { expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ complete: false, failed: 1, repaired: 0 }); }
    finally { state.unavailable = false; }
    expect(await mapping('domain', h.domain)).toBeUndefined();
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ complete: true, repaired: 1 });
    passed('transport outage and rediscovery recovery');
  });
  it('rolls back every mapping in a failed TutorialDB transaction and permits recovery', async () => {
    const h = await hierarchy(); state.rollbackTutorial = true;
    try { expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ failed: 1, complete: false }); }
    finally { state.rollbackTutorial = false; }
    expect(await mapping('domain', h.domain)).toBeUndefined();
    expect(await mapping('subtopic', h.subtopic)).toBeUndefined();
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ repaired: 1, complete: true });
    passed('real TutorialDB rollback and safe retry');
  });
  it('retains committed mappings after MainDB completion fails and reconciles without duplicates', async () => {
    const h = await hierarchy(); state.failMainCompletion = true;
    try { expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ failed: 1, complete: false }); }
    finally { state.failMainCompletion = false; }
    const committed = await mapping('subtopic', h.subtopic);
    expect(committed).toBeDefined();
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ repaired: 0, alreadyConsistent: 1, complete: true });
    expect((await mapping('subtopic', h.subtopic)).id).toBe(committed.id);
    passed('cross-database partial completion remains safe and honestly reported');
  });
  it('revalidates source existence after a concurrent deletion wins the parent lock', async () => {
    const h = await hierarchy(false); const deleting = await main.connect();
    try {
      await deleting.query('BEGIN'); await deleting.query('SELECT id FROM topics WHERE id=$1 FOR UPDATE', [h.topic]);
      const work = reconcile('topic', h.topic);
      await new Promise(resolve => setTimeout(resolve, 150));
      await deleting.query('DELETE FROM topics WHERE id=$1', [h.topic]); await deleting.query('COMMIT');
      expect(await work).toMatchObject({ failed: 1, repaired: 0, complete: false });
      expect(await mapping('topic', h.topic)).toBeUndefined();
    } finally { await deleting.query('ROLLBACK'); deleting.release(); }
    passed('delete-first race cannot create an orphan mapping');
  });
  it('holds the MainDB parent lock through the actual TutorialDB commit', async () => {
    const h = await hierarchy(false);
    let entered!: () => void;
    let release!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const proceed = new Promise<void>(resolve => { release = resolve; });
    state.beforeTutorialCommit = async () => { entered(); await proceed; };
    const work = reconcile('topic', h.topic);
    await ready;
    const deleting = await main.connect();
    let acquired = false;
    try {
      await deleting.query('BEGIN');
      const locking = deleting.query('SELECT id FROM topics WHERE id=$1 FOR UPDATE', [h.topic]).then(() => { acquired = true; });
      try {
        await new Promise(resolve => setTimeout(resolve, 150));
        expect(acquired).toBe(false);
      } finally { release(); }
      expect(await work).toMatchObject({ repaired: 1, complete: true });
      await locking;
      // A deletion preflight now observes the committed dependency and must retain the parent.
      expect(await mapping('topic', h.topic)).toBeDefined();
      expect((await main.query('SELECT id FROM topics WHERE id=$1', [h.topic])).rowCount).toBe(1);
    } finally {
      state.beforeTutorialCommit = undefined;
      release();
      await deleting.query('ROLLBACK'); deleting.release();
    }
    passed('write-first real transaction retains ancestor lock until commit');
  });
  it('times out under an actual parent lock and succeeds after the lock is released', async () => {
    const h = await hierarchy(); const blocker = await main.connect();
    try {
      await blocker.query('BEGIN'); await blocker.query('SELECT id FROM topics WHERE id=$1 FOR UPDATE', [h.topic]);
      expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ failed: 1, repaired: 0, complete: false });
      expect(await mapping('subtopic', h.subtopic)).toBeUndefined();
      await blocker.query('ROLLBACK');
      expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ repaired: 1, complete: true });
    } finally { await blocker.query('ROLLBACK'); blocker.release(); }
    passed('actual PostgreSQL lock timeout and later recovery');
  });
  it('counts post-commit verification failure as unresolved instead of repaired success', async () => {
    const h = await hierarchy();
    state.afterTutorialCommit = async () => {
      await tutorial.query('UPDATE tutorial_topics SET name=$1 WHERE external_id=$2', ['injected concurrent stale name', h.topic]);
    };
    try { expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ failed: 1, repaired: 0, complete: false }); }
    finally { state.afterTutorialCommit = undefined; }
    expect(await reconcile('subtopic', h.subtopic)).toMatchObject({ repaired: 1, complete: true });
    passed('post-commit comparison detects changed state and retries safely');
  });
  it('returns a deterministic bounded continuation and never claims the first page is complete', async () => {
    const a = await hierarchy(); const b = await hierarchy();
    const entities = [entity('domain', a.domain), entity('domain', b.domain)];
    const first = await HierarchySyncService.retryFailed({ entities, limit: 1 });
    expect(first).toMatchObject({ checked: 1, repaired: 1, complete: false, scanComplete: false, remaining: null });
    expect(first.nextCursor).toBeDefined();
    const second = await HierarchySyncService.retryFailed({ entities, limit: 1, cursor: first.nextCursor });
    expect(second).toMatchObject({ checked: 1, repaired: 1, complete: true, scanComplete: true });
    passed('bounded stable cursor over explicitly scoped entities');
  });

  it('exercises the real local signed worker HTTP boundary and scoped PostgreSQL repair', async () => {
    const h = await hierarchy();
    const url = 'http://localhost:3000/api/workers/retry-hierarchy-sync';
    const key = workerEnvironment.QSTASH_CURRENT_SIGNING_KEY;
    const internalKey = workerEnvironment.INTERNAL_API_KEY;
    expect(key?.length).toBeGreaterThan(0);
    expect(internalKey?.length).toBeGreaterThan(0);
    const body = JSON.stringify({ entities: [entity('subtopic', h.subtopic)] });
    const sign = async (value: string, signingKey = key, expires = Math.floor(Date.now() / 1000) + 60) => new SignJWT({
      body: createHash('sha256').update(value).digest('base64url'),
    }).setProtectedHeader({ alg: 'HS256' }).setIssuer('Upstash').setSubject(url)
      .setExpirationTime(expires).sign(new TextEncoder().encode(signingKey));
    const send = (value: string, signature: string) => fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': internalKey, 'upstash-signature': signature },
      body: value, signal: AbortSignal.timeout(180000),
    });
    expect((await send(body, await sign(body, 'isolated-wrong-signing-key'))).status).toBe(401);
    expect(await mapping('subtopic', h.subtopic)).toBeUndefined();
    const signature = await sign(body);
    expect((await send(JSON.stringify({ limit: 1 }), signature)).status).toBe(401);
    expect((await send(body, await sign(body, key, Math.floor(Date.now() / 1000) - 120))).status).toBe(401);
    const response = await send(body, await sign(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, mode: 'CURRENT_STATE_RECONCILIATION', repaired: 1, checked: 1, complete: true });
    // The existing API ETag middleware canonicalizes mutation responses to this
    // no-store policy, which prohibits storage by private and shared caches.
    const cacheControl = response.headers.get('cache-control');
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).not.toMatch(/\bpublic\b|s-maxage=/);
    expect((await mapping('subtopic', h.subtopic)).topic_id).toBe((await mapping('topic', h.topic)).id);
    passed('actual local worker HTTP real QStash cryptography and real scoped repair');
  }, 240000);
});
