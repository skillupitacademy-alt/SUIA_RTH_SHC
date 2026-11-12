import { expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ rows: [] as Array<Array<Record<string, unknown>>>, match: vi.fn() }));
vi.mock('@quiz/db-people', () => { const c = new Proxy({}, { get: () => ({}) }); return { db: {}, faculty: c, users: c, userProfiles: c, attendanceRecords: c, batchEnrollments: c, batchSessions: c, batches: c, paymentInstallments: c, subjects: c, domains: c }; });
vi.mock('@quiz/db-placement', () => { const c = new Proxy({}, { get: () => ({}) }); const q = { from: () => q, where: () => q, limit: async () => f.rows.shift(), orderBy: async () => f.rows.shift() }; return { db: { select: () => q }, findJobsForStudent: f.match, jobListings: c, studentPlacementProfiles: c }; });
import { getSkillupPlacement } from '../skillup-data';

vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Offline network guard: no external requests allowed in tests'); }));

it('returns null match for zero vector score', async () => {
  f.rows = [[{ userId: 'fixture', status: 'active', readinessScore: 50, skills: ['test'] }], [{ id: 'job', companyName: 'Fixture', title: 'Job', location: 'Remote' }]];
  f.match.mockResolvedValue([{ id: 'job', score: 0 }]);
  const result = await getSkillupPlacement('fixture');
  expect(result.jobs[0].match).toBe(null);
  expect(result.matchingStatus).toBe('uncalibrated');
});
