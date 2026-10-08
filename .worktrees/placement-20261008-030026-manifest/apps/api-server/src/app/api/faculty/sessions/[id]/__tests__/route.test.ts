import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from '../route';

const mocks = vi.hoisted(() => ({
  resolveFacultyAccess: vi.fn(),
  updateFacultyBatchSession: vi.fn(),
}));

vi.mock('@/lib/tutorial-faculty-access', () => ({
  resolveFacultyAccess: mocks.resolveFacultyAccess,
  updateFacultyBatchSession: mocks.updateFacultyBatchSession,
}));

describe('PATCH /api/faculty/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when faculty auth is missing', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce(null);

    const response = await PATCH(
      new NextRequest('http://localhost/api/faculty/sessions/session-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionNotes: 'Updated notes' }),
      }),
      {
        params: Promise.resolve({ id: 'session-1' }),
      }
    );

    expect(response.status).toBe(401);
  });

  it('updates an existing session', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce({ facultyId: 'faculty-1', userId: 'user-1' });
    mocks.updateFacultyBatchSession.mockResolvedValueOnce({
      id: 'session-1',
      batchId: 'batch-1',
      scheduledAt: new Date('2026-03-22T12:00:00.000Z'),
      durationMinutes: 90,
      sessionNotes: 'Updated notes',
      status: 'completed',
    });

    const response = await PATCH(
      new NextRequest('http://localhost/api/faculty/sessions/session-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: '2026-03-22T12:00:00.000Z',
          durationMinutes: 90,
          sessionNotes: 'Updated notes',
          status: 'completed',
        }),
      }),
      {
        params: Promise.resolve({ id: 'session-1' }),
      }
    );

    expect(response.status).toBe(200);
    expect(mocks.updateFacultyBatchSession).toHaveBeenCalledTimes(1);
  });
});
