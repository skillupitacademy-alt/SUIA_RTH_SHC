import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const rows = vi.hoisted(() => ({ value: [] as Array<{ status: string; markedAt: string }> }));
vi.mock('@quiz/db-people', () => {
  const columns = new Proxy({}, { get: () => ({}) });
  const query = { from: () => query, where: () => query, orderBy: async () => rows.value };
  return { db: { select: () => query }, faculty: columns, users: columns, userProfiles: columns, attendanceRecords: columns, batchEnrollments: columns, batchSessions: columns, batches: columns, paymentInstallments: columns, subjects: columns, domains: columns };
});
vi.mock('@quiz/db-placement', () => ({ db: {}, findJobsForStudent: vi.fn(), jobListings: {}, studentPlacementProfiles: {} }));
import { getSkillupAttendance } from '../skillup-data';
beforeEach(() => { rows.value = []; vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });
it('returns persisted attendance state without inventing its cause', async () => {
  rows.value = [{ status: 'late', markedAt: '2026-01-01T00:00:00Z' }, { status: 'absent', markedAt: '2026-01-02T00:00:00Z' }];
  const result = await getSkillupAttendance('learner');
  expect(result.history.map(({ state, note }) => ({ state, note }))).toEqual([{ state: 'late', note: 'Details unavailable' }, { state: 'absent', note: 'Details unavailable' }]);
});
