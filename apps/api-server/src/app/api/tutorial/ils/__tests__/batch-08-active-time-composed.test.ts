import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../block-active-time/route';
import { POST as visit } from '../block-visit/route';

const fixture = vi.hoisted(() => ({ events: new Map<string, any>(), state: new Map<string, number>(), fail: false, claims: 0, writes: 0, visits: new Map<string, any>(), blocks: [] as any[] }));
vi.mock('@quiz/db-tutorial', async original => {
  const actual = await original<typeof import('@quiz/db-tutorial')>();
  class Section { async getTutorialByPageIdentity(sub: string, node: string, brand: string) { return sub === '22222222-2222-4222-8222-222222222222' && node === 'node-1' && brand === 'skillup' ? { id: 'section', content: { schemaVersion: 1, blocks: fixture.blocks } } : undefined; } }
  class Events { withDb() { return this; } async claimEvent(data: any) { fixture.claims++; if (fixture.events.has(data.eventId)) return null; fixture.events.set(data.eventId, data); return data; } async findByEventId(id: string) { return fixture.events.get(id); } }
  class State { withDb() { return this; } async upsert(data: any) { fixture.writes++; if (data.lastSessionId) { const old = fixture.visits.get(data.blockId); const value = { ...data, visitCount: old ? old.visitCount + (old.lastSessionId === data.lastSessionId ? 0 : 1) : 1, revisionCount: 0 }; fixture.visits.set(data.blockId, value); return value; } if (fixture.fail) throw new Error('isolated state outage'); const key = `${data.userId}:${data.navigationNodeId}:${data.blockId}:${data.blockVersion}`; const total = (fixture.state.get(key) ?? 0) + data.activeTimeSec; fixture.state.set(key, total); return { ...data, activeTimeSec: total }; } async findOne(data: any) { const key = `${data.userId}:${data.navigationNodeId}:${data.blockId}:${data.blockVersion}`; return { ...data, activeTimeSec: fixture.state.get(key) ?? 0 }; } }
  return { ...actual, TutorialNavigationProgressRepository: class {}, TutorialSectionRepository: Section, BlockLearningStateRepository: State, BlockTelemetryEventRepository: Events, db: {} };
});
vi.mock('../../../../../../../../packages/db-tutorial/src/db', () => ({ db: { transaction: async (fn: (tx: unknown) => Promise<unknown>) => { const events = new Map(fixture.events); const state = new Map(fixture.state); try { return await fn({}); } catch (error) { fixture.events = events; fixture.state = state; throw error; } } } }));
const previous = process.env.INTERNAL_API_SECRET;
const body = { navigationNodeId: 'node-1', subtopicId: '22222222-2222-4222-8222-222222222222', blockId: 'known', blockVersion: 'D1', eventId: '11111111-1111-4111-8111-111111111111', activeTimeSec: 30 };
function request(input = body, brand = 'skillup', secret = 'disposable-secret', user = 'learner') { return new NextRequest('http://localhost/api/tutorial/ils/block-active-time', { method: 'POST', headers: { 'x-internal-secret': secret, 'x-user-id': user, 'x-brand': brand, 'content-type': 'application/json' }, body: JSON.stringify(input) }); }
describe('composed active-time entry and real service', () => {
  beforeEach(() => { process.env.INTERNAL_API_SECRET = 'disposable-secret'; fixture.events.clear(); fixture.state.clear(); fixture.visits.clear(); fixture.blocks = [{ id: 'known', type: 'definition', version: 'D1', content: {} }]; fixture.fail = false; fixture.claims = 0; fixture.writes = 0; });
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
    expect(fixture.claims).toBe(1); expect(fixture.writes).toBe(1);
  });
  it('denies invalid credentials and foreign hierarchy before event effects', async () => {
    expect((await POST(request(body, 'skillup', 'invalid'))).status).toBe(401);
    expect((await POST(request(body, 'realtutorialhub'))).status).toBe(400);
    expect((await POST(request({ ...body, navigationNodeId: 'wrong' }))).status).toBe(400);
    expect(fixture.claims).toBe(0); expect(fixture.writes).toBe(0);
  });
  it('acknowledges historical exact replay after content removal without restoring missing state', async () => {
    expect((await POST(request())).status).toBe(200);
    fixture.blocks = []; fixture.state.clear();
    const replay = await POST(request());
    expect(replay.status).toBe(200); expect(await replay.json()).toMatchObject({ alreadyProcessed: true });
    expect(fixture.writes).toBe(1); expect(fixture.state.size).toBe(0);
    const newEvent = { ...body, eventId: '33333333-3333-4333-8333-333333333333' };
    expect((await POST(request(newEvent))).status).toBe(400); expect(fixture.claims).toBe(1);
  });
  it.each([
    [[{ id: 'known', type: 'definition', content: {} }]],
    [[{ id: 'known', type: 'code', progressRole: 'instructional', content: {} }]],
    [[{ id: 'known', type: 'definition', version: '', content: {} }]],
    [[{ id: 'known', type: 'definition', version: 'D1', content: {} }, { id: 'known', type: 'definition', version: 'D1', content: {} }]],
  ])('denies malformed or duplicate content before visit and credit', async blocks => {
    fixture.blocks = blocks;
    const invalid = { ...body, blockVersion: blocks[0].version === undefined ? 'unversioned' : 'D1' };
    expect((await POST(request(invalid))).status).toBe(400);
    const visitRequest = new NextRequest('http://localhost/api/tutorial/ils/block-visit', { method: 'POST', headers: { 'x-internal-secret': 'disposable-secret', 'x-user-id': 'learner', 'x-brand': 'skillup', 'content-type': 'application/json' }, body: JSON.stringify({ ...invalid, sessionId: 's1' }) });
    expect((await visit(visitRequest)).status).toBe(400); expect(fixture.claims).toBe(0); expect(fixture.writes).toBe(0);
  });
  it('denies unseen invalid visit identities before visit effects', async () => {
    const makeVisit = (blockId: string, blockVersion: string) => new NextRequest('http://localhost/api/tutorial/ils/block-visit', { method: 'POST', headers: { 'x-internal-secret': 'disposable-secret', 'x-user-id': 'learner', 'x-brand': 'skillup', 'content-type': 'application/json' }, body: JSON.stringify({ navigationNodeId: 'node-1', subtopicId: body.subtopicId, blockId, blockVersion, sessionId: 's1' }) });
    expect((await visit(makeVisit('unknown', 'D1'))).status).toBe(400);
    expect((await visit(makeVisit('known', 'D2'))).status).toBe(400);
    expect(fixture.writes).toBe(0);
    expect((await visit(makeVisit('known', 'D1'))).status).toBe(200);
  });
  it('accepts 500 roots plus a nested child under the existing document limit', async () => {
    fixture.blocks = Array.from({ length: 499 }, (_, i) => ({ id: `heading-${i}`, type: 'heading', content: {} }));
    fixture.blocks.push({ id: 'parent', type: 'two-column', content: { left: { blocks: [{ id: 'child', type: 'definition', version: 'D1', content: {} }] }, right: { blocks: [] } } });
    expect((await POST(request({ ...body, blockId: 'child' }))).status).toBe(200);
  });
  it.each(['two-column', 'three-column', 'card-grid', 'timeline'])('accepts nested child in %s container', async kind => {
    const child = { id: 'child', type: 'definition', version: 'D1', content: {} };
    const content = kind === 'two-column' ? { left: { blocks: [child] }, right: { blocks: [] } } : kind === 'three-column' ? { columns: [{ blocks: [child] }, { blocks: [] }, { blocks: [] }] } : kind === 'card-grid' ? { cards: [{ blocks: [child] }] } : { items: [{ blocks: [child] }] };
    fixture.blocks = [{ id: 'parent', type: kind, content }];
    expect((await POST(request({ ...body, blockId: 'child' }))).status).toBe(200);
  });
  it('rejects cyclic container content before any claim', async () => {
    const cyclic: any[] = []; cyclic.push({ id: 'parent', type: 'two-column', content: { left: { blocks: cyclic }, right: { blocks: [] } } });
    fixture.blocks = cyclic;
    expect((await POST(request({ ...body, blockId: 'parent', blockVersion: 'unversioned' }))).status).toBe(400); expect(fixture.claims).toBe(0);
  });
  it('accepts structural parent and nested versioned child telemetry', async () => {
    fixture.blocks = [{ id: 'parent', type: 'two-column', content: { left: { blocks: [{ id: 'child', type: 'definition', version: 'D1', content: {} }] }, right: { blocks: [] } } }];
    expect((await POST(request({ ...body, blockId: 'parent', blockVersion: 'unversioned' }))).status).toBe(200);
    expect((await POST(request({ ...body, eventId: '33333333-3333-4333-8333-333333333333', blockId: 'child' }))).status).toBe(200);
  });
  it('permits one concurrent first claim in the isolated transaction adapter', async () => {
    const [first, second] = await Promise.all([POST(request()), POST(request())]);
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    const responses = [await first.json(), await second.json()];
    expect(responses.filter(result => result.processed)).toHaveLength(1);
    expect(responses.filter(result => result.alreadyProcessed)).toHaveLength(1);
    expect(fixture.writes).toBe(1); expect([...fixture.state.values()]).toEqual([30]);
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
  it.each([['other-block', 'D1', 'node-1'], ['known', 'D2', 'node-1']])('rejects conflicting duplicate block/version %s/%s', async (blockId, blockVersion, node) => {
    expect((await POST(request())).status).toBe(200);
    const response = await POST(request({ ...body, blockId, blockVersion, navigationNodeId: node }));
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
