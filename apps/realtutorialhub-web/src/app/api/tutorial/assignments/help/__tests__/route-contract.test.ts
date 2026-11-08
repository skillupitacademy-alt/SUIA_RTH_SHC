import { NextRequest } from 'next/server';
import { beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ auth: vi.fn(), submit: vi.fn() }));
vi.mock('@/lib/assignment-auth', () => ({ requireStudent: fixture.auth, AssignmentAuthError: class extends Error { constructor(message: string, public statusCode: number) { super(message); } } }));
vi.mock('@/server/assignment.service', () => ({ AssignmentService: class { submitHelpRequest = fixture.submit; } }));
vi.mock('@/middleware/observability.middleware', () => ({ withObservability: (handler: unknown) => handler }));
import { POST } from '../route';
import { AssignmentAuthError } from '@/lib/assignment-auth';
const valid = { subtopicId: '11111111-1111-4111-8111-111111111111', assignmentId: '22222222-2222-4222-8222-222222222222', question: 'Help' };
const req = (body: unknown) => new NextRequest('http://localhost/api/tutorial/assignments/help', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
beforeEach(() => { fixture.auth.mockReset().mockResolvedValue({ userId: 'verified-user' }); fixture.submit.mockReset().mockResolvedValue({ id: 'help' }); });
it('forwards authenticated principal and schema-valid values', async () => {
  expect((await POST(req(valid))).status).toBe(201);
  expect(fixture.submit).toHaveBeenCalledExactlyOnceWith('verified-user', valid.subtopicId, valid.assignmentId, valid.question);
});
it('denies malformed payload and missing authentication before service', async () => {
  expect((await POST(req({ ...valid, assignmentId: 'invalid' }))).status).toBe(400);
  fixture.auth.mockRejectedValueOnce(new AssignmentAuthError('Unauthorized', 401));
  expect((await POST(req(valid))).status).toBe(401);
  expect(fixture.submit).not.toHaveBeenCalled();
});
