// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ token: vi.fn(), verify: vi.fn(), isComplete: vi.fn() }));
vi.mock('@quiz/auth', () => ({ TokenService: class {
  getAccessToken = mocks.token;
  static verifyAccessToken = mocks.verify;
} }));
vi.mock('@quiz/db-tutorial', () => ({ TutorialProgressRepository: class { isSubtopicComplete = mocks.isComplete; } }));

import { requireAssignmentAccess, requireStudent } from '../assignment-auth';
import { GET as content } from '@/app/api/tutorial/content/[subtopicId]/route';
import { POST as retiredWriter } from '@/app/api/content-manager/add-section/route';
const principal = { userId: 'rth-1', originalUserId: 'global-1', shadowUserId: 'rth-1', brand: 'realtutorialhub', roles: ['student'] };
const request = () => new NextRequest('https://user.realtutorialhub.com/api/tutorial/content/topic-1');
beforeEach(() => { vi.clearAllMocks(); mocks.token.mockReturnValue('token'); mocks.verify.mockResolvedValue(principal); });
afterEach(() => vi.restoreAllMocks());

describe('RTH learner boundary', () => {
  it('uses the authenticated RTH tenant for assignment eligibility', async () => {
    mocks.isComplete.mockResolvedValue(true);
    expect(await requireAssignmentAccess(request(), 'topic-1')).toEqual(principal);
    expect(mocks.isComplete).toHaveBeenCalledWith('rth-1', 'topic-1', 'realtutorialhub');
  });
  it('rejects incomplete assignment prerequisites', async () => {
    mocks.isComplete.mockResolvedValue(false);
    await expect(requireAssignmentAccess(request(), 'topic-1')).rejects.toMatchObject({ statusCode: 403 });
  });
  it('never reads assignment progress for a foreign tenant', async () => {
    mocks.verify.mockResolvedValue({ ...principal, brand: 'skillup' });
    await expect(requireAssignmentAccess(request(), 'topic-1')).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.isComplete).not.toHaveBeenCalled();
  });
  it.each([null, '  '])('rejects a missing or empty token', async token => {
    mocks.token.mockReturnValue(token);
    await expect(requireStudent(request())).rejects.toMatchObject({ statusCode: 401 });
  });
  it('rejects an invalid token', async () => {
    mocks.verify.mockRejectedValue(new Error('invalid'));
    await expect(requireStudent(request())).rejects.toMatchObject({ statusCode: 401 });
  });
  it.each([undefined, 'skillup', 'skillhubcore'])('rejects brand %s', async brand => {
    mocks.verify.mockResolvedValue({ ...principal, brand, platforms: ['realtutorialhub'] });
    await expect(requireStudent(request())).rejects.toMatchObject({ statusCode: 403 });
  });
  it('rejects a missing user identity', async () => {
    mocks.verify.mockResolvedValue({ ...principal, userId: '' });
    await expect(requireStudent(request())).rejects.toMatchObject({ statusCode: 401 });
  });
  it('rejects an empty role set', async () => {
    mocks.verify.mockResolvedValue({ ...principal, roles: [] });
    await expect(requireStudent(request())).rejects.toMatchObject({ statusCode: 403 });
  });
  it('accepts a valid RTH learner', async () => {
    expect(await requireStudent(request())).toEqual(principal);
    expect(mocks.verify).toHaveBeenCalledWith('token', { audience: 'user', isAdmin: false });
  });
  it('does not cache personalized content publicly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ progress: { completed: true } }));
    const response = await content(request(), { params: Promise.resolve({ subtopicId: 'topic-1' }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      cache: 'no-store', headers: expect.objectContaining({ 'X-Brand': 'realtutorialhub', 'X-User-ID': 'rth-1' }),
    }));
  });
  it('returns 403 and does not fetch content for the wrong brand', async () => {
    mocks.verify.mockResolvedValue({ ...principal, brand: 'skillup' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect((await content(request(), { params: Promise.resolve({ subtopicId: 'topic-1' }) })).status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('retires the source-file writer', async () => {
    expect((await retiredWriter()).status).toBe(410);
  });
});
