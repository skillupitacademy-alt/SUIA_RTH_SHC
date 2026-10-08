import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionRequestDuplicateError, SessionRequestForbiddenError, SessionRequestNotFoundError } from '@quiz/types';

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  requestSession: vi.fn(),
  getMyRequests: vi.fn(),
  cancelMyRequest: vi.fn(),
}));

vi.mock('@/lib/assignment-auth', () => ({
  AssignmentAuthError: class AssignmentAuthError extends Error {
    constructor(message: string, public readonly statusCode: 401 | 403 = 401) {
      super(message);
      this.name = 'AssignmentAuthError';
    }
  },
  requireStudent: mocks.requireStudent,
}));

vi.mock('@/server/live-session.service', () => ({
  liveSessionService: {
    requestSession: mocks.requestSession,
    getMyRequests: mocks.getMyRequests,
    cancelMyRequest: mocks.cancelMyRequest,
  },
}));

import { GET as getMyRequests } from '../my-requests/route';
import { DELETE as deleteRequest } from '../[requestId]/route';
import { POST as requestSession } from '../request/route';

const studentId = crypto.randomUUID();
const requestId = crypto.randomUUID();
const subtopicId = crypto.randomUUID();

const makePostRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/tutorial/sessions/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const makeGetRequest = () => new NextRequest('http://localhost/api/tutorial/sessions/my-requests', { method: 'GET' });

const makeDeleteRequest = () => new NextRequest(`http://localhost/api/tutorial/sessions/${requestId}`, { method: 'DELETE' });

describe('tutorial session routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ userId: studentId, roles: ['student'] });
    mocks.requestSession.mockResolvedValue({ id: requestId, studentId, subtopicId, status: 'pending' });
    mocks.getMyRequests.mockResolvedValue([{ id: requestId, studentId, subtopicId, status: 'pending' }]);
    mocks.cancelMyRequest.mockResolvedValue({ id: requestId, status: 'cancelled' });
  });

  it('creates a request and returns 201', async () => {
    const response = await requestSession(makePostRequest({ subtopicId, doubtText: 'Need help' }));

    expect(response.status).toBe(201);
    expect(mocks.requestSession).toHaveBeenCalledWith(studentId, subtopicId, 'Need help');
  });

  it('returns 409 for duplicate requests', async () => {
    mocks.requestSession.mockRejectedValueOnce(new SessionRequestDuplicateError(studentId, subtopicId));

    const response = await requestSession(makePostRequest({ subtopicId, doubtText: 'Need help' }));

    expect(response.status).toBe(409);
  });

  it('returns 400 for malformed request payloads', async () => {
    const response = await requestSession(makePostRequest({ doubtText: 'Need help' }));

    expect(response.status).toBe(400);
  });

  it('returns the student requests with no-cache headers', async () => {
    const response = await getMyRequests(makeGetRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(mocks.getMyRequests).toHaveBeenCalledWith(studentId);
  });

  it('returns 401 when student auth is missing', async () => {
    mocks.requireStudent.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await getMyRequests(makeGetRequest());

    expect(response.status).toBe(401);
  });

  it('cancels a student request', async () => {
    const response = await deleteRequest(makeDeleteRequest(), { params: Promise.resolve({ requestId }) });

    expect(response.status).toBe(200);
    expect(mocks.cancelMyRequest).toHaveBeenCalledWith(studentId, requestId);
  });

  it('returns 403 when another student owns the request', async () => {
    mocks.cancelMyRequest.mockRejectedValueOnce(new SessionRequestForbiddenError(requestId));

    const response = await deleteRequest(makeDeleteRequest(), { params: Promise.resolve({ requestId }) });

    expect(response.status).toBe(403);
  });

  it('returns 404 when the request is missing', async () => {
    mocks.cancelMyRequest.mockRejectedValueOnce(new SessionRequestNotFoundError(requestId));

    const response = await deleteRequest(makeDeleteRequest(), { params: Promise.resolve({ requestId }) });

    expect(response.status).toBe(404);
  });
});
