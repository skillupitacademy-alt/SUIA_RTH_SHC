import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ results: [] as Array<Array<Record<string, unknown>>>, fail: false }));
vi.mock('@quiz/db-people', () => {
  const columns = new Proxy({}, { get: () => ({}) });
  const getResult = async () => { if (state.fail) throw new Error('store unavailable'); return state.results.shift() ?? []; };
  const query = { from: () => query, innerJoin: () => query, leftJoin: () => query, where: () => query, limit: getResult, orderBy: getResult };
  return { db: { select: () => query }, faculty: columns, users: columns, userProfiles: columns,
    attendanceRecords: columns, batchEnrollments: columns, batchSessions: columns, batches: columns, paymentInstallments: columns, subjects: columns, domains: columns };
});
vi.mock('@quiz/db-placement', () => ({ db: {}, findJobsForStudent: vi.fn(), jobListings: {}, studentPlacementProfiles: {} }));
import { getSkillupBatches, getSkillupMyBatch } from '../skillup-data';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });
describe.each([getSkillupBatches, getSkillupMyBatch])('batch data truth', (load) => {
  beforeEach(() => { state.results = []; state.fail = false; });
  it('returns no batch when there is no active enrollment', async () => {
    expect(await load('learner')).toEqual({ batch: null, sessions: [] });
  });
  it('retains enrolled batch and completed session without invented recording or next session', async () => {
    state.results = [[{ batchId: 'b', batchName: 'Stored batch', enrolledCount: 2, facultyName: null }], [{ id: 's', scheduledAt: '2026-01-01T00:00:00Z', title: 'Stored note', mode: 'online', status: 'completed' }]];
    const result = await load('learner');
    expect(result.batch).toMatchObject({ name: 'Stored batch', nextSession: null, materials: [] });
    expect(result.sessions[0]).toMatchObject({ id: 's', status: 'completed' });
    expect(result.sessions[0]).not.toHaveProperty('recording');
  });
  it('propagates storage failure', async () => {
    state.fail = true;
    await expect(load('learner')).rejects.toThrow('store unavailable');
  });
});
