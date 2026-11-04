import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../block-active-time/route';
import { POST as visit } from '../block-visit/route';

const fixture = vi.hoisted(() => ({ events: new Map<string, any>(), state: new Map<string, number>(), fail: false, claims: 0, writes: 0, visits: new Map<string, any>() }));
vi.mock('@quiz/db-tutorial', async original => {
  const actual = await original<typeof import('@quiz/db-tutorial')>();
  class Section { async getTutorialByPageIdentity(sub: string, node: string, brand: string) { return sub === '22222222-2222-4222-8222-222222222222' && node === 'node-1' && brand === 'skillup' ? { id: 'section', content: { schemaVersion: 1, blocks: [{ id: 'known', type: 'definition', version: 'D1' }] } } : undefined; } }
  class Events { withDb() { return this; } async claimEvent(data: any) { fixture.claims++; if (fixture.events.has(data.eventId)) return null; fixture.events.set(data.eventId, data); return data; } async findByEventId(id: string) { return fixture.events.get(id); } }
  class State { withDb() { return this; } async upsert(data: any) { fixture.writes++; if (data.lastSessionId) { const old = fixture.visits.get(data.blockId); const value = { ...data, visitCount: old ? old.visitCount + (old.lastSessionId === data.lastSessionId ? 0 : 1) : 1, revisionCount: 0 }; fixture.visits.set(data.blockId, value); return value; } if (fixture.fail) throw new Error('isolated state outage'); const key = `${data.userId}:${data.navigationNodeId}:${data.blockId}:${data.blockVersion}`; const total = (fixture.state.get(key) ?? 0) + data.activeTimeSec; fixture.state.set(key, total); return { ...data, activeTimeSec: total }; } async findOne(data: any) { const key = `${data.userId}:${data.navigationNodeId}:${data.blockId}:${data.blockVersion}`; return { ...data, activeTimeSec: fixture.state.get(key) ?? 0 }; } }
  return { ...actual, TutorialNavigationProgressRepository: class {}, TutorialSectionRepository: Section, BlockLearningStateRepository: State, BlockTelemetryEventRepository: Events, db: {} };
});
vi.mock('../../../../../../../../packages/db-tutorial/src/db', () => ({ db: { transaction: async (fn: (tx: unknown) => Promise<unknown>) => { const events = new Map(fixture.events); const state = new Map(fixture.state); try { return await fn({}); } catch (error) { fixture.events = events; fixture.state = state; throw error; } } } }));
const previous = process.env.INTERNAL_API_SECRET;
const body = { navigationNodeId: 'node-1', subtopicId: '22222222-2222-4222-8222-222222222222', blockId: 'known', blockVersion: 'D1', eventId: '11111111-1111-4111-8111-111111111111', activeTimeSec: 30 };
function request(input = body, brand = 'skillup', secret = 'disposable-secret', user = 'learner') { return new NextRequest('http://localhost/api/tutorial/ils/block-active-time', { method: 'POST', headers: { 'x-internal-secret': secret, 'x-user-id': user, 'x-brand': brand, 'content-type': 'application/json' }, body: JSON.stringify(input) }); }
describe('composed active-time entry and real service', () => {
  beforeEach(() => { process.env.INTERNAL_API_SECRET = 'disposable-secret'; fixture.events.clear(); fixture.state.clear(); fixture.visits.clear(); fixture.fail = false; fixture.claims = 0; fixture.writes = 0; });
  afterEach(() => { if (previous === undefined) delete process.env.INTERNAL_API_SECRET; else process.env.INTERNAL_API_SECRET = previous; });
  it('records same and new visit sessions without manufacturing completion', async () => {
    const visitRequest = (session: string, secret = 'disposable-secret') => new NextRequest('http://localhost/api/tutorial/ils/block-visit', { method: 'POST', headers: { 'x-internal-secret': secret, 'x-user-id': 'learner', 'x-brand': 'skillup', 'content-type': 'application/json' }, body: JSON.stringify({ navigationNodeId: 'node-1', subtopicId: body.subtopicId, blockId: 'known', blockVersion: 'D1', sessionId: session }) });
    const first = await visit(visitRequest('s1')); const same = await visit(visitRequest('s1')); const next = await visit(visitRequest('s2'));
    expect((await first.json()).data.visitCount).toBe(1); expect((await same.json()).data.visitCount).toBe(1); expect((await next.json()).data.visitCount).toBe(2);
    expect(fixture.visits.get('known').completedAt).toBeUndefined();
    const before = fixture.writes; expect((await visit(visitRequest('s3', 'invalid'))).status).toBe(401); expect(fixture.writes).toBe(before);
  });
  it('processes a valid event and acknowledges an identical retry once', async () => {
    const first = await POST(request()); const second = await POST(request());
    expect(first.status).toBe(200); expect(await first.json()).toMatchObject({ processed: true });
    expect(second.status).toBe(200); expect(await second.json()).toMatchObject({ alreadyProcessed: true });
    expect(fixture.claims).toBe(2); expect(fixture.writes).toBe(1);
  });
  it('denies invalid credentials and foreign hierarchy before event effects', async () => {
    expect((await POST(request(body, 'skillup', 'invalid'))).status).toBe(401);
    expect((await POST(request(body, 'realtutorialhub'))).status).toBe(400);
    expect((await POST(request({ ...body, navigationNodeId: 'wrong' }))).status).toBe(400);
    expect(fixture.claims).toBe(0); expect(fixture.writes).toBe(0);
  });
  it('models a committed event with a lost acknowledgement and retry', async () => {
    await POST(request()); // Deliberately drop the first response after commit.
    const retry = await POST(request());
    expect(retry.status).toBe(200); expect(await retry.json()).toMatchObject({ alreadyProcessed: true });
    expect(fixture.events.size).toBe(1); expect([...fixture.state.values()]).toEqual([30]); expect(fixture.writes).toBe(1);
  });
  it('rejects a duplicate event under another local subject before state credit', async () => {
    expect((await POST(request())).status).toBe(200);
    const response = await POST(request(body, 'skillup', 'disposable-secret', 'other'));
    expect(response.status).toBe(400); expect(fixture.writes).toBe(1); expect([...fixture.state.values()]).toEqual([30]);
  });
  it('rolls back a failed state update then credits a retry exactly once', async () => {
    fixture.fail = true; expect((await POST(request())).status).toBe(500); expect(fixture.events.size).toBe(0); expect(fixture.state.size).toBe(0);
    fixture.fail = false; expect((await POST(request())).status).toBe(200); expect(fixture.events.size).toBe(1); expect([...fixture.state.values()]).toEqual([30]);
  });
  it.each([['unknown', 'D1'], ['known', 'D2']])('denies unregistered block/version %s/%s before event effects', async (blockId, blockVersion) => {
    const response = await POST(request({ ...body, blockId, blockVersion }));
    expect.soft(response.status).toBe(400); expect(fixture.claims).toBe(0); expect(fixture.writes).toBe(0);
  });
});
