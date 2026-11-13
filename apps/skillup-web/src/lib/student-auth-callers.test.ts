import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  verify: vi.fn(), person: vi.fn(), dashboard: vi.fn(), batch: vi.fn(),
  batches: vi.fn(), placement: vi.fn(),
}));
vi.mock('@quiz/auth', () => ({ TokenService: class {
  static verifyUserAccessToken = state.verify;
  getAccessToken() { return 'synthetic-access'; }
} }));
vi.mock('@quiz/db-people', () => ({
  db: { query: { users: { findFirst: state.person } } },
  users: { id: 'person-id', externalId: 'local-id', platform: 'platform', isActive: 'active', deletedAt: 'deleted' },
}));
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn(), isNull: vi.fn() }));
vi.mock('@/lib/skillup-data', () => ({
  getSkillupStudentDashboard: state.dashboard, getSkillupMyBatch: state.batch,
  getSkillupBatches: state.batches, getSkillupPlacement: state.placement,
}));

import { GET as dashboard } from '@/app/api/student/dashboard/route';
import { GET as batch } from '@/app/api/student/my-batch/route';
import { GET as batches } from '@/app/api/batches/route';
import { GET as placement } from '@/app/api/student/placement/route';
import { GET as progress, POST as writeProgress } from '@/app/api/tutorial/progress/route';
import { GET as sections } from '@/app/api/tutorial/sections/[subtopicId]/route';

const learnerUserId = '11111111-1111-4111-8111-111111111111';
const peoplePersonId = '22222222-2222-4222-8222-222222222222';
const subtopicId = '33333333-3333-4333-8333-333333333333';
const principal = { userId: learnerUserId, originalUserId: learnerUserId, shadowUserId: peoplePersonId, brand: 'skillup', roles: ['student'] };
function request(path: string, method = 'GET', body?: unknown) {
  return new NextRequest('http://skillup.localhost:3009' + path, {
    method, headers: { cookie: 'accessToken=synthetic-access; refreshToken=synthetic-refresh', 'x-user-id': peoplePersonId },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  state.verify.mockResolvedValue(principal);
  state.person.mockReset().mockResolvedValue({ id: peoplePersonId });
  for (const operation of [state.dashboard, state.batch, state.batches, state.placement]) operation.mockResolvedValue({ data: [] });
  vi.stubEnv('INTERNAL_API_URL', 'http://localhost:3000');
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ data: {} })));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('existing non-HOLD SUIA caller identity boundaries', () => {
  const peopleOperations = [
    ['/api/student/dashboard', dashboard, state.dashboard],
    ['/api/student/my-batch', batch, state.batch],
    ['/api/batches', batches, state.batches],
    ['/api/student/placement', placement, state.placement],
  ] as const;

  it.each(peopleOperations)('%s uses the mapped PeopleDB person ID', async (path, handler, operation) => {
    expect((await handler(request(path))).status).toBe(200);
    expect(operation).toHaveBeenCalledExactlyOnceWith(peoplePersonId);
    expect(operation).not.toHaveBeenCalledWith(learnerUserId);
  });

  it.each(peopleOperations)('%s denies missing person identity before business lookup', async (path, handler, operation) => {
    state.verify.mockResolvedValue({ ...principal, shadowUserId: undefined });
    expect((await handler(request(path))).status).toBe(403);
    expect(state.person).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  });

  it.each(peopleOperations)('%s denies a missing/stale person mapping before business lookup', async (path, handler, operation) => {
    state.person.mockResolvedValue(undefined);
    expect((await handler(request(path))).status).toBe(403);
    expect(operation).not.toHaveBeenCalled();
  });

  it('forwards local progress ownership for both GET and POST with a distinct person UUID', async () => {
    expect((await progress(request('/api/tutorial/progress?subtopicId=' + subtopicId))).status).toBe(200);
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({ 'X-Brand': 'skillup', 'X-User-ID': learnerUserId }),
    }));
    expect((await writeProgress(request('/api/tutorial/progress', 'POST', {
      subtopicId, blockType: 'code', status: 'viewed', userId: peoplePersonId,
    }))).status).toBe(200);
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({ 'X-User-ID': learnerUserId }),
      body: JSON.stringify({ subtopicId, blockType: 'code', status: 'viewed' }),
    }));
    expect(state.person).not.toHaveBeenCalled();
  });

  it('permits verified learner-only progress and sections without a person projection', async () => {
    state.verify.mockResolvedValue({ ...principal, shadowUserId: undefined });
    state.person.mockRejectedValue(new Error('PeopleDB must remain unused'));
    expect((await progress(request('/api/tutorial/progress?subtopicId=' + subtopicId))).status).toBe(200);
    expect((await sections(request('/api/tutorial/sections/' + subtopicId), {
      params: Promise.resolve({ subtopicId }),
    })).status).toBe(200);
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({ 'X-User-ID': learnerUserId }),
    }));
    expect(state.person).not.toHaveBeenCalled();
  });
});
