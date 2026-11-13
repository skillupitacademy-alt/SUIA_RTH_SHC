import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ verify: vi.fn(), person: vi.fn() }));
vi.mock('@quiz/auth', () => ({ TokenService: { verifyUserAccessToken: mocks.verify } }));
vi.mock('@quiz/db-people', () => ({
  db: { query: { users: { findFirst: mocks.person } } },
  users: { id: 'person-id', externalId: 'local-id', platform: 'platform', isActive: 'active', deletedAt: 'deleted' },
}));
vi.mock('drizzle-orm', () => ({
  eq: (column: string, value: unknown) => ({ column, value }),
  and: (...conditions: unknown[]) => conditions,
  isNull: (column: string) => ({ column, value: null }),
}));

import { requireStudentAuth } from './student-auth';
import { GET as content } from '@/app/api/tutorial/content/[subtopicId]/route';
import { GET as sections } from '@/app/api/tutorial/sections/[subtopicId]/route';
import { POST as retiredWriter } from '@/app/api/content-manager/add-section/route';

const learnerUserId = '11111111-1111-4111-8111-111111111111';
const peoplePersonId = '22222222-2222-4222-8222-222222222222';
const principal = { userId: learnerUserId, shadowUserId: peoplePersonId, originalUserId: learnerUserId, brand: 'skillup', roles: ['student'] };
function request(cookie = true, path = '/api/tutorial/content/topic-1') {
  return new NextRequest(`http://skillup.localhost:3009${path}`, {
    headers: cookie ? { cookie: 'accessToken=token' } : { 'x-user-id': 'forged-user' },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.verify.mockResolvedValue(principal);
  mocks.person.mockReset().mockResolvedValue({ id: peoplePersonId });
});
afterEach(() => vi.restoreAllMocks());

describe('SkillUp learner boundary', () => {
  it('rejects raw identity headers', async () => {
    const result = await requireStudentAuth(request(false));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it.each([undefined, 'realtutorialhub', 'skillhubcore'])('rejects brand %s even with SkillUp membership', async brand => {
    mocks.verify.mockResolvedValue({ ...principal, brand, platforms: ['skillup'] });
    const result = await requireStudentAuth(request());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });
  it('returns explicit distinct learner and mapped PeopleDB identities', async () => {
    expect(await requireStudentAuth(request())).toMatchObject({
      ok: true, learnerUserId, peoplePersonId, userId: peoplePersonId,
    });
    expect(mocks.person).toHaveBeenCalledWith({
      columns: { id: true }, where: [
        { column: 'person-id', value: peoplePersonId },
        { column: 'local-id', value: learnerUserId },
        { column: 'platform', value: 'skillup' },
        { column: 'active', value: true },
        { column: 'deleted', value: null },
      ],
    });
  });
  it.each([undefined, null, '', ' ', 'invalid-person-uuid'])('never falls back to learner ID for absent/invalid person %j', async shadowUserId => {
    mocks.verify.mockResolvedValue({ ...principal, shadowUserId });
    const denied = await requireStudentAuth(request());
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.response.status).toBe(403);
    expect(mocks.person).not.toHaveBeenCalled();
    const local = await requireStudentAuth(request(), { identity: 'learner' });
    expect(local).toMatchObject({ ok: true, learnerUserId, peoplePersonId: null });
    expect(local).not.toHaveProperty('userId');
    expect(mocks.person).not.toHaveBeenCalled();
  });
  it('requires a persisted link even when a signed person UUID equals the learner UUID', async () => {
    mocks.verify.mockResolvedValue({ ...principal, shadowUserId: learnerUserId });
    mocks.person.mockResolvedValue(undefined);
    const denied = await requireStudentAuth(request());
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.response.status).toBe(403);
    expect(mocks.person).toHaveBeenCalledWith(expect.objectContaining({ where: expect.arrayContaining([
      { column: 'person-id', value: learnerUserId }, { column: 'local-id', value: learnerUserId },
    ]) }));
  });
  it('denies a stale/wrong PeopleDB projection while learner-only authentication stays available', async () => {
    mocks.person.mockResolvedValue(undefined);
    const denied = await requireStudentAuth(request(), { identity: 'people' });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.response.status).toBe(403);
    mocks.person.mockClear();
    expect(await requireStudentAuth(request(), { identity: 'learner' })).toMatchObject({ ok: true, learnerUserId });
    expect(mocks.person).not.toHaveBeenCalled();
  });
  it('returns a sanitized503 when PeopleDB validation is unavailable', async () => {
    mocks.person.mockRejectedValue(new Error('private database credential'));
    const denied = await requireStudentAuth(request());
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.response.status).toBe(503);
      expect(await denied.response.text()).not.toContain('private database credential');
    }
  });
  it('denies a missing local subject despite an otherwise valid person claim', async () => {
    mocks.verify.mockResolvedValue({ ...principal, userId: undefined });
    const result = await requireStudentAuth(request(), { identity: 'learner' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
    expect(mocks.person).not.toHaveBeenCalled();
  });
  it('preserves the existing role gate before any PeopleDB lookup', async () => {
    mocks.verify.mockResolvedValue({ ...principal, roles: ['unapproved-role'] });
    const result = await requireStudentAuth(request());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
    expect(mocks.person).not.toHaveBeenCalled();
  });
  it('ignores forged x-user-id, x-brand, and x-original-host headers when verifying token identity', async () => {
    const forgedRequest = new NextRequest('http://skillup.localhost:3009/api/tutorial/sections/topic-1', {
      headers: {
        cookie: 'accessToken=token',
        'x-user-id': 'forged-other-student',
        'x-brand': 'realtutorialhub',
        'x-original-host': 'user.realtutorialhub.com',
      },
    });
    const result = await requireStudentAuth(forgedRequest);
    expect(result).toMatchObject({ ok: true, learnerUserId, peoplePersonId, userId: peoplePersonId });
  });
  it('returns the retired contract without fetching legacy content', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await content(request(), { params: Promise.resolve({ subtopicId: 'topic-1' }) });
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ error: 'Gone', statusCode: 410 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('does not cache tutorial sections publicly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ sections: [] }));
    const response = await sections(request(true, '/api/tutorial/sections/topic-1'), { params: Promise.resolve({ subtopicId: 'topic-1' }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      cache: 'no-store', headers: expect.objectContaining({ 'X-Brand': 'skillup', 'X-User-ID': learnerUserId }),
    }));
  });
  it('keeps the legacy route retired for foreign-brand callers', async () => {
    mocks.verify.mockResolvedValue({ ...principal, brand: 'realtutorialhub' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect((await content(request(), { params: Promise.resolve({ subtopicId: 'topic-1' }) })).status).toBe(410);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('retires the source-file writer', async () => {
    expect((await retiredWriter()).status).toBe(410);
  });
});
