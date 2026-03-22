import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    requireStudent: vi.fn(),
    submitHelpRequest: vi.fn(),
  };
});

vi.mock('@/lib/assignment-auth', () => ({
  requireStudent: mocks.requireStudent,
}));

vi.mock('@/lib/assignment', () => ({
  assignmentService: {
    submitHelpRequest: mocks.submitHelpRequest,
  },
  assignmentHelpSchema: {
    safeParse: (value: unknown) => {
      if (typeof value === 'object' && value !== null && 'subtopicId' in value && 'assignmentId' in value && 'question' in value) {
        return { success: true, data: value };
      }
      return { success: false, error: { issues: [{ message: 'Invalid payload' }] } };
    },
  },
}));

import { POST } from '../route';

const userId = crypto.randomUUID();
const subtopicId = crypto.randomUUID();
const assignmentId = crypto.randomUUID();

const createRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/tutorial/assignments/help', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('assignment help route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ userId, roles: ['student'] });
    mocks.submitHelpRequest.mockResolvedValue({ id: 'help-1', question: 'Need help' });
  });

  it('creates a help request for a student', async () => {
    const response = await POST(createRequest({ subtopicId, assignmentId, question: 'Need help' }));

    expect(response.status).toBe(201);
    expect(mocks.submitHelpRequest).toHaveBeenCalledWith(userId, subtopicId, assignmentId, 'Need help');
  });

  it('returns 401 when student auth is missing', async () => {
    mocks.requireStudent.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await POST(createRequest({ subtopicId, assignmentId, question: 'Need help' }));

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(createRequest({ subtopicId, assignmentId }));

    expect(response.status).toBe(400);
  });
});
