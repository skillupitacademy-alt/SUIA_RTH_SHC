import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ results: [] as Array<Array<Record<string, unknown>>> }));
vi.mock('@quiz/db-people', () => {
  const columns = new Proxy({}, { get: () => ({}) });
  const next = () => state.results.shift() ?? [];
  const query = { from: () => query, innerJoin: () => query, leftJoin: () => query, where: () => query, limit: async () => next(), orderBy: async () => next(), then: (resolve: (rows: Array<Record<string, unknown>>) => void) => resolve(next()) };
  return { db: { select: () => query }, faculty: columns, users: columns, userProfiles: columns, attendanceRecords: columns, batchEnrollments: columns, batchSessions: columns, batches: columns, paymentInstallments: columns, subjects: columns, domains: columns };
});
vi.mock('@quiz/db-placement', () => {
  const columns = new Proxy({}, { get: () => ({}) });
  const query = { from: () => query, where: async () => state.results.shift() ?? [] };
  return { db: { select: () => query }, findJobsForStudent: vi.fn(), jobListings: columns, studentPlacementProfiles: columns };
});
import { getSkillupStudentDashboard } from '../skillup-data';
beforeEach(() => { state.results = []; vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });
describe('dashboard source truth', () => {
  it('does not invent batch, faculty, topic, recording or next session when no enrollment exists', async () => {
    state.results = [[{ id: 'learner', name: 'Learner', email: 'fixture@example.invalid' }], [], [], [], [{ id: 'open-job' }]];
    const result = await getSkillupStudentDashboard('learner');
    expect(result.summary).toMatchObject({ batchName: 'Unavailable', facultyName: 'Unavailable', currentTopic: 'Unavailable', nextSessionAt: null, placementMatches: 1 });
    expect(result.sessions).toEqual([]);
  });
});
