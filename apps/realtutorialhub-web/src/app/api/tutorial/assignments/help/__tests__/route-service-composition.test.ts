import { NextRequest } from 'next/server';
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), publish: vi.fn(), auth: vi.fn() }));
vi.mock('@quiz/events', () => ({ publishEvent: f.publish }));
vi.mock('@quiz/db-tutorial', () => ({ db: {}, AssignmentRepository: class { getAssignments = f.get; createHelpRequest = f.create; }, TutorialProgressRepository: class {} }));
vi.mock('@/lib/assignment-auth', () => ({ requireStudent: f.auth, AssignmentAuthError: class extends Error { constructor(message: string, public statusCode: number) { super(message); } } }));
vi.mock('@/middleware/observability.middleware', () => ({ withObservability: (handler: unknown) => handler }));
import { POST } from '../route';
const valid = { subtopicId: '11111111-1111-4111-8111-111111111111', assignmentId: '22222222-2222-4222-8222-222222222222', question: 'Help' };
const req = (body: unknown) => new NextRequest('http://localhost/api/tutorial/assignments/help', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
beforeEach(() => { vi.clearAllMocks(); f.auth.mockResolvedValue({ userId: 'verified-user' }); f.get.mockResolvedValue([{ id: valid.assignmentId }]); f.create.mockImplementation(async (input) => ({ id: 'help', ...input })); f.publish.mockResolvedValue({}); });
it('composes route validation and service membership through the fixture repository', async () => {
  expect((await POST(req(valid))).status).toBe(201);
  expect(f.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'verified-user', assignmentId: valid.assignmentId }));
  expect(f.publish).toHaveBeenCalledOnce();
});
it('rejects malformed or foreign assignment before a repository write', async () => {
  expect((await POST(req({ ...valid, assignmentId: 'invalid' }))).status).toBe(400);
  expect(f.get).not.toHaveBeenCalled();
  f.get.mockResolvedValue([]);
  expect((await POST(req(valid))).status).toBe(500);
  expect(f.create).not.toHaveBeenCalled(); expect(f.publish).not.toHaveBeenCalled();
});
