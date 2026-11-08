import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ auth: vi.fn(), dashboard: vi.fn(), attendance: vi.fn() }));
vi.mock('@/lib/student-auth', () => ({ requireStudentAuth: f.auth }));
vi.mock('@/lib/skillup-data', () => ({ getSkillupStudentDashboard: f.dashboard, getSkillupAttendance: f.attendance }));
import { GET as dashboard } from '../dashboard/route';
import { GET as attendance } from '../attendance/route';
const req = new Request('https://fixture.invalid') as Parameters<typeof dashboard>[0];
beforeEach(() => { f.auth.mockReset().mockResolvedValue({ ok: true, userId: 'fixture' }); f.dashboard.mockReset().mockResolvedValue({ count: 0 }); f.attendance.mockReset().mockResolvedValue({ records: [] }); });
it.each([[dashboard, f.dashboard], [attendance, f.attendance]])('sets private no-store for authenticated data', async (handler, data) => {
  const response = await handler(req);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(data).toHaveBeenCalledWith('fixture');
});
it.each([[dashboard, f.dashboard], [attendance, f.attendance]])('preserves denial without data read', async (handler, data) => {
  f.auth.mockResolvedValue({ ok: false, response: new Response(null, { status: 401, headers: { 'cache-control': 'private, no-store' } }) });
  const response = await handler(req);
  expect(response.status).toBe(401);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(data).not.toHaveBeenCalled();
});
