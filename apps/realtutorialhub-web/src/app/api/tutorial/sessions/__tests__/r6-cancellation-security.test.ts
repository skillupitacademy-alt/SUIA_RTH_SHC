import { NextRequest } from 'next/server';
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ student: vi.fn(), cancel: vi.fn() }));
vi.mock('@/lib/assignment-auth', () => ({
  AssignmentAuthError: class extends Error {}, requireStudent: state.student,
}));
vi.mock('@/server/live-session.service', () => ({ liveSessionService: { cancelMyRequest: state.cancel } }));
import { DELETE } from '../[requestId]/route';
const requestId = '11111111-1111-4111-8111-111111111111';
afterEach(() => vi.resetAllMocks());
it('sanitizes cancellation provider failures and prohibits storing private responses', async () => {
  state.student.mockResolvedValue({ userId: 'owner-a' });
  state.cancel.mockRejectedValue(new Error('connection postgres://private-database-secret failed SELECT student_id'));
  const response = await DELETE(new NextRequest(
    `http://realtutorialhub.localhost:3003/api/tutorial/sessions/${requestId}`, { method: 'DELETE' },
  ), { params: Promise.resolve({ requestId }) });
  expect(response.status).toBe(500);
  expect(await response.text()).not.toMatch(/postgres|private-database-secret|SELECT student_id/);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
