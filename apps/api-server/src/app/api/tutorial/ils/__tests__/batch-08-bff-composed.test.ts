import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenService } from '@quiz/auth';
import { DefinitionD1BlockSchema } from '@quiz/types';
import { createD1Fixture } from '../../../../../../../../packages/db-tutorial/src/services/__tests__/test-fixtures';
import { POST as central } from '../block-active-time/route';
const fixture = vi.hoisted(() => ({ writes: [] as any[] }));
vi.mock('@quiz/db-tutorial', async original => {
  const actual = await original<typeof import('@quiz/db-tutorial')>();
  class Section { async getTutorialByPageIdentity() { return { id: 'section', content: { schemaVersion: 1, blocks: [createD1Fixture({ id: '44444444-4444-4444-8444-444444444444' })] } }; } }
  class Events { withDb() { return this; } async findByEventId() { return null; } async claimEvent(input: any) { return input; } }
  class State { withDb() { return this; } async upsert(input: any) { fixture.writes.push(input); return input; } }
  return { ...actual, TutorialNavigationProgressRepository: class {}, TutorialSectionRepository: Section, BlockLearningStateRepository: State, BlockTelemetryEventRepository: Events, db: {} };
});
vi.mock('../../../../../../../../packages/db-tutorial/src/db', () => ({ db: { transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}) } }));
const secret = new TextEncoder().encode('isolated-bff-composition-key-32bytes!');
const tokens = new TokenService(secret, secret, secret);
const oldToken = TokenService.getInstance();
const oldSecret = process.env.INTERNAL_API_SECRET;
const oldKey = process.env.INTERNAL_API_KEY;
const oldFetch = globalThis.fetch;
const body = { navigationNodeId: 'node', subtopicId: '22222222-2222-4222-8222-222222222222', blockId: '44444444-4444-4444-8444-444444444444', blockVersion: 'D1', eventId: '11111111-1111-4111-8111-111111111111', activeTimeSec: 30 };
describe('learner BFF to central ILS service', () => {
  beforeEach(() => { fixture.writes.length = 0; TokenService.setInstance(tokens); process.env.INTERNAL_API_SECRET = 'disposable-secret'; process.env.INTERNAL_API_KEY = 'disposable-key'; });
  afterEach(() => { globalThis.fetch = oldFetch; TokenService.setInstance(oldToken); if (oldSecret === undefined) delete process.env.INTERNAL_API_SECRET; else process.env.INTERNAL_API_SECRET = oldSecret; if (oldKey === undefined) delete process.env.INTERNAL_API_KEY; else process.env.INTERNAL_API_KEY = oldKey; });
  it.each(['skillup', 'realtutorialhub'] as const)('forwards signed %s subject to the real central service', async brand => {
    expect(DefinitionD1BlockSchema.safeParse(createD1Fixture({ id: body.blockId })).success).toBe(true);
    const bff = brand === 'skillup' ? await import('../../../../../../../skillup-web/src/app/api/tutorial/ils/block-active-time/route') : await import('../../../../../../../realtutorialhub-web/src/app/api/tutorial/ils/block-active-time/route');
    const signed = await tokens.generateAccessToken({ userId: 'local-user', originalUserId: 'original-user', shadowUserId: 'shadow-user', brand, roles: ['student'], tokenType: 'user', aud: 'user' });
    let forwardedSession: string | null = null;
    globalThis.fetch = vi.fn(async (_url, options) => { forwardedSession = new Headers(options?.headers).get('x-session-id'); return central(new NextRequest('http://localhost/api/tutorial/ils/block-active-time', { method: 'POST', headers: options?.headers, body: options?.body as string })); });
    const incoming = new NextRequest('http://localhost/api/tutorial/ils/block-active-time', { method: 'POST', headers: { authorization: `Bearer ${signed}`, 'x-session-id': 'browser-session' }, body: JSON.stringify(body) });
    expect((await bff.POST(incoming)).status).toBe(200);
    expect(fixture.writes).toHaveLength(1);
    expect(forwardedSession).toBeNull();
    expect(fixture.writes[0]).not.toHaveProperty('sessionId');
    expect(fixture.writes[0].userId).toBe(brand === 'skillup' ? 'shadow-user' : 'local-user');
    const invalid = new NextRequest(incoming.url, { method: 'POST', headers: { authorization: 'Bearer invalid' }, body: JSON.stringify(body) });
    expect((await bff.POST(invalid)).status).toBe(401);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const noSession = new NextRequest(incoming.url, { method: 'POST', headers: { authorization: `Bearer ${signed}` }, body: JSON.stringify({ ...body, eventId: '66666666-6666-4666-8666-666666666666' }) });
    expect((await bff.POST(noSession)).status).toBe(200);
    expect(forwardedSession).toBeNull();
    expect(fixture.writes).toHaveLength(2);

    const wrongVersion = new NextRequest(incoming.url, { method: 'POST', headers: { authorization: `Bearer ${signed}`, 'x-session-id': 'browser-session' }, body: JSON.stringify({ ...body, blockVersion: 'D2' }) });
    expect((await bff.POST(wrongVersion)).status).toBe(400);
    expect(fixture.writes).toHaveLength(2);
  });
});
