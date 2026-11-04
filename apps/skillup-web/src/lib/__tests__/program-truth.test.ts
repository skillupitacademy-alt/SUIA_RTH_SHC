import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, fail: false }));
vi.mock('@quiz/db-people', () => {
  const columns = { id: {}, name: {}, subjectId: {}, domainId: {}, status: {}, deletedAt: {}, createdAt: {} };
  const query = { from: () => query, leftJoin: () => query, where: () => query, orderBy: async () => {
    if (state.fail) throw new Error('store unavailable');
    return state.rows;
  } };
  return { db: { select: () => query }, batches: columns, subjects: columns, domains: columns,
    attendanceRecords: {}, batchEnrollments: {}, batchSessions: {}, paymentInstallments: {}, faculty: {}, userProfiles: {}, users: {} };
});
vi.mock('@quiz/db-placement', () => ({ db: {}, findJobsForStudent: vi.fn(), jobListings: {}, studentPlacementProfiles: {} }));
import { getSkillupProgramBySlug, getSkillupProgramDetail, getSkillupPrograms } from '../skillup-data';

beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });
describe('program data truth', () => {
  beforeEach(() => { state.rows = []; state.fail = false; });
  it('returns empty results and no invented slug when the store has no rows', async () => {
    expect(await getSkillupPrograms()).toEqual({ programs: [] });
    expect(await getSkillupProgramBySlug('full-stack-web')).toBeUndefined();
    expect(await getSkillupProgramDetail('full-stack-web')).toBeNull();
  });
  it('retains persisted identity and status without inventing a curriculum', async () => {
    state.rows = [{ id: 'real', slug: 'real', name: 'Stored batch', description: 'Math', audience: 'Science', status: 'completed' }];
    const program = await getSkillupProgramDetail('real');
    expect(program).toMatchObject({ id: 'real', name: 'Stored batch', summary: 'Batch status: completed', duration: 'Unavailable', curriculum: [], highlights: [] });
  });
  it('propagates unavailable storage rather than fabricating records', async () => {
    state.fail = true;
    await expect(getSkillupPrograms()).rejects.toThrow('store unavailable');
  });
});
