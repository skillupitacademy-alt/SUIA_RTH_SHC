import { NextRequest } from 'next/server';
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ auth: vi.fn(), submit: vi.fn() }));
vi.mock('@/lib/assignment-auth', () => ({ requireStudent: f.auth, AssignmentAuthError: class extends Error { constructor(message: string, public statusCode: number) { super(message); } } }));
vi.mock('@/server/assignment.service', () => ({ AssignmentService: class { submitHelpRequest = f.submit; } }));
vi.mock('@/middleware/observability.middleware', () => ({ withObservability: (handler: unknown) => handler }));
import { POST } from '../route';
import { AssignmentAuthError } from '@/lib/assignment-auth';
const body = { subtopicId: '11111111-1111-4111-8111-111111111111', assignmentId: '22222222-2222-4222-8222-222222222222', question: 'Help' };
const req = () => new NextRequest('http://localhost/api/tutorial/assignments/help', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => { f.auth.mockReset().mockResolvedValue({ userId: 'user' }); f.submit.mockReset().mockResolvedValue({ id: 'help' }); });
it('preserves forbidden status for a wrong-brand denial', async () => {
  f.auth.mockRejectedValueOnce(new AssignmentAuthError('sensitive-fixture-detail', 403));
  expect((await POST(req())).status).toBe(403);
  expect(f.submit).not.toHaveBeenCalled();
});
it('does not expose unexpected internal service details', async () => {
  f.submit.mockRejectedValueOnce(new Error('sensitive-fixture-detail'));
  const response = await POST(req());
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('sensitive-fixture-detail');
});
