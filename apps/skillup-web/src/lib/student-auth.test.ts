import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('@quiz/auth', () => ({ TokenService: { verifyUserAccessToken: mocks.verify } }));

import { requireStudentAuth } from './student-auth';
import { GET as content } from '@/app/api/tutorial/content/[subtopicId]/route';
import { GET as sections } from '@/app/api/tutorial/sections/[subtopicId]/route';
import { POST as retiredWriter } from '@/app/api/content-manager/add-section/route';

const principal = { userId: 'global-1', shadowUserId: 'skillup-1', originalUserId: 'global-1', brand: 'skillup', roles: ['student'] };
function request(cookie = true, path = '/api/tutorial/content/topic-1') {
  return new NextRequest(`https://user.skillupitacademy.com${path}`, {
    headers: cookie ? { cookie: 'accessToken=token' } : { 'x-user-id': 'forged-user' },
  });
}
beforeEach(() => { vi.clearAllMocks(); mocks.verify.mockResolvedValue(principal); });
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
  it('preserves the brand-local identity contract', async () => {
    expect(await requireStudentAuth(request())).toMatchObject({ ok: true, userId: 'skillup-1' });
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
      cache: 'no-store', headers: expect.objectContaining({ 'X-Brand': 'skillup', 'X-User-ID': 'skillup-1' }),
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
