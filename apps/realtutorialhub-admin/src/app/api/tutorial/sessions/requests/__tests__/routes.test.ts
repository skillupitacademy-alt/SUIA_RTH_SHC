import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getPendingRequests: vi.fn(),
  acceptRequest: vi.fn(),
  scheduleRequest: vi.fn(),
  completeRequest: vi.fn(),
}));

vi.mock('@/lib/tutorial-content-api', () => ({
  TutorialAuthError: class TutorialAuthError extends Error {
    constructor(message: string, public readonly statusCode: 401 | 403 = 401) {
      super(message);
      this.name = 'TutorialAuthError';
    }
  },
  isTutorialAuthError: (error: unknown) => error instanceof Error && 'statusCode' in error,
  requireAdmin: mocks.requireAdmin,
}));

vi.mock('@quiz/db-tutorial/live-session.service', () => ({
  liveSessionService: {
    getPendingRequests: mocks.getPendingRequests,
    acceptRequest: mocks.acceptRequest,
    scheduleRequest: mocks.scheduleRequest,
    completeRequest: mocks.completeRequest,
  },
}));

import { PATCH as acceptRequest } from '../[id]/accept/route';
import { PATCH as completeRequest } from '../[id]/complete/route';
import { PATCH as scheduleRequest } from '../[id]/schedule/route';
import { GET } from '../route';

const adminId = crypto.randomUUID();
const requestId = crypto.randomUUID();
const subtopicId = crypto.randomUUID();

const makeGetRequest = () =>
  new NextRequest(`http://localhost/api/admin/tutorial/sessions/requests?status=pending&subtopicId=${subtopicId}`, {
    method: 'GET',
  });

const makePatchRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/admin/tutorial/sessions/requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('admin tutorial session routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ userId: adminId, roles: ['ADMIN'], isAdmin: true });
    mocks.getPendingRequests.mockResolvedValue([{ id: requestId, status: 'pending' }]);
    mocks.acceptRequest.mockResolvedValue({ id: requestId, status: 'accepted' });
    mocks.scheduleRequest.mockResolvedValue({
      id: requestId,
      status: 'scheduled',
      meetingLink: 'https://meet.example.com/session',
    });
    mocks.completeRequest.mockResolvedValue({ id: requestId, status: 'completed' });
  });

  it('returns pending requests for admins', async () => {
    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(mocks.getPendingRequests).toHaveBeenCalledWith({ status: 'pending', subtopicId });
  });

  it('returns 403 for non-admin tokens', async () => {
    const error = Object.assign(new Error('Forbidden'), { statusCode: 403 });
    mocks.requireAdmin.mockRejectedValueOnce(error);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(403);
  });

  it('accepts a request for admins', async () => {
    const response = await acceptRequest(makePatchRequest({}), { params: Promise.resolve({ id: requestId }) });

    expect(response.status).toBe(200);
    expect(mocks.acceptRequest).toHaveBeenCalledWith(adminId, requestId);
  });

  it('validates meeting links when scheduling', async () => {
    const response = await scheduleRequest(
      new NextRequest(`http://localhost/api/admin/tutorial/sessions/requests/${requestId}/schedule`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scheduledAt: new Date('2026-03-23T10:00:00.000Z').toISOString(), meetingLink: 'not-a-url' }),
      }),
      { params: Promise.resolve({ id: requestId }) }
    );

    expect(response.status).toBe(400);
  });

  it('schedules a request for admins', async () => {
    const response = await scheduleRequest(
      new NextRequest(`http://localhost/api/admin/tutorial/sessions/requests/${requestId}/schedule`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scheduledAt: new Date('2026-03-23T10:00:00.000Z').toISOString(), meetingLink: 'https://meet.example.com/session' }),
      }),
      { params: Promise.resolve({ id: requestId }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.scheduleRequest).toHaveBeenCalledWith(
      adminId,
      requestId,
      new Date('2026-03-23T10:00:00.000Z'),
      'https://meet.example.com/session'
    );
  });

  it('completes a request for admins', async () => {
    const response = await completeRequest(makePatchRequest({}), { params: Promise.resolve({ id: requestId }) });

    expect(response.status).toBe(200);
    expect(mocks.completeRequest).toHaveBeenCalledWith(adminId, requestId);
  });
});
