import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, fail: false }));
vi.mock('@quiz/db-people', () => {
  const columns = { id: {}, name: {}, userId: {}, status: {}, availabilityType: {} };
  const query = { from: () => query, innerJoin: () => query, leftJoin: () => query, where: async () => {
    if (state.fail) throw new Error('store unavailable');
    return state.rows;
  } };
  return { db: { select: () => query }, faculty: columns, users: columns, userProfiles: columns,
    attendanceRecords: {}, batchEnrollments: {}, batchSessions: {}, batches: {}, paymentInstallments: {}, subjects: {}, domains: {} };
});
vi.mock('@quiz/db-placement', () => ({ db: {}, findJobsForStudent: vi.fn(), jobListings: {}, studentPlacementProfiles: {} }));
import { getSkillupFaculty } from '../skillup-data';
describe('faculty data truth', () => {
  beforeEach(() => { state.rows = []; state.fail = false; });
  it('reports empty faculty and zero active count without sample people', async () => {
    expect(await getSkillupFaculty()).toEqual({ faculty: [], heroStats: [{ label: 'Active mentors', value: '0' }] });
  });
  it('renders stored faculty and no manufactured quality metric', async () => {
    state.rows = [{ name: 'Stored mentor', title: 'parttime' }];
    expect(await getSkillupFaculty()).toEqual({ faculty: [{ name: 'Stored mentor', title: 'parttime', description: 'Faculty details unavailable' }], heroStats: [{ label: 'Active mentors', value: '1' }] });
  });
  it('propagates storage failure', async () => {
    state.fail = true;
    await expect(getSkillupFaculty()).rejects.toThrow('store unavailable');
  });
});
