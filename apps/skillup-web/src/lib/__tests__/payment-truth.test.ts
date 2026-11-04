import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, query: vi.fn() }));
vi.mock('pg', () => ({ Pool: class { query = state.query; } }));
vi.mock('@quiz/db-people', () => ({ db: {}, faculty: {}, users: {}, userProfiles: {}, attendanceRecords: {}, batchEnrollments: {}, batchSessions: {}, batches: {}, paymentInstallments: {}, subjects: {}, domains: {} }));
vi.mock('@quiz/db-placement', () => ({ db: {}, findJobsForStudent: vi.fn(), jobListings: {}, studentPlacementProfiles: {} }));
beforeEach(() => { vi.resetModules(); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); vi.stubEnv('DATABASE_DIRECT_URL_PAYMENT', ''); vi.stubEnv('DATABASE_URL_PAYMENT', ''); state.query.mockReset(); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('signals unavailable when the payment store is not configured', async () => {
  const { getSkillupPayments } = await import('../skillup-data');
  await expect(getSkillupPayments('learner')).rejects.toThrow('Payment data unavailable');
  expect(state.query).not.toHaveBeenCalled();
});
it('distinguishes an empty query from unavailable and retains persisted rows', async () => {
  vi.stubEnv('DATABASE_URL_PAYMENT', 'isolated-fixture');
  state.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 'stored', installmentNumber: 2, dueDate: '2026-01-01', amount: 0, status: 'paid', paymentRef: null }] });
  const { getSkillupPayments } = await import('../skillup-data');
  expect(await getSkillupPayments('learner')).toEqual({ installments: [] });
  expect((await getSkillupPayments('learner')).installments[0]).toMatchObject({ id: 'stored', amount: 0, status: 'paid' });
});
