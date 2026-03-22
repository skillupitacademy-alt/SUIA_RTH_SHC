import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    requireAdmin: vi.fn(),
    getHelpRequests: vi.fn(),
    updateHelpRequest: vi.fn(),
  };
});

vi.mock('@/lib/tutorial-content-api', () => ({
  requireAdmin: mocks.requireAdmin,
  isTutorialAuthError: (error: unknown) => error instanceof Error && 'statusCode' in error,
}));

vi.mock('@quiz/db-tutorial', () => ({
  AssignmentRepository: class {
    getHelpRequests = mocks.getHelpRequests;
    updateHelpRequest = mocks.updateHelpRequest;
    constructor() {}
  },
}));

import { PATCH } from '../[id]/route';
import { GET } from '../route';

const adminId = crypto.randomUUID();
const helpId = crypto.randomUUID();

const makeGetRequest = () =>
  new NextRequest(`http://localhost/api/admin/tutorial/assignments/help-requests?status=open&subtopicId=${crypto.randomUUID()}`, {
    method: 'GET',
  });

const makePatchRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/admin/tutorial/assignments/help-requests/${helpId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('admin assignment help request routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ userId: adminId, roles: ['ADMIN'], isAdmin: true });
    mocks.getHelpRequests.mockResolvedValue([{ id: helpId, question: 'Need help' }]);
    mocks.updateHelpRequest.mockResolvedValue({ id: helpId, status: 'resolved' });
  });

  it('returns open help requests for admins', async () => {
    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    expect(mocks.getHelpRequests).toHaveBeenCalled();
  });

  it('returns 401 when admin auth is missing', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(401);
  });

  it('updates a help request for admins', async () => {
    const response = await PATCH(makePatchRequest({ status: 'resolved', assignedTo: null }), {
      params: Promise.resolve({ id: helpId }),
    });

    expect(response.status).toBe(200);
    expect(mocks.updateHelpRequest).toHaveBeenCalledWith(helpId, {
      status: 'resolved',
      assignedTo: undefined,
      resolvedAt: undefined,
    });
  });
});
