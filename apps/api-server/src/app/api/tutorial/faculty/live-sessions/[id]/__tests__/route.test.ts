import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from '../route';

const mocks = vi.hoisted(() => ({
  resolveFacultyAccess: vi.fn(),
  updateFacultyLiveSession: vi.fn(),
}));

vi.mock('@/lib/tutorial-faculty-access', () => ({
  resolveFacultyAccess: mocks.resolveFacultyAccess,
  updateFacultyLiveSession: mocks.updateFacultyLiveSession,
}));

describe('PATCH /api/tutorial/faculty/live-sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without faculty auth', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce(null);

    const response = await PATCH(
      new NextRequest('http://localhost/api/tutorial/faculty/live-sessions/request-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'scheduled' }),
      }),
      { params: Promise.resolve({ id: 'request-1' }) }
    );

    expect(response.status).toBe(401);
  });

  it('updates the live session request', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce({ facultyId: 'faculty-1', userId: 'user-1' });
    mocks.updateFacultyLiveSession.mockResolvedValueOnce({
      id: 'request-1',
      studentId: 'student-1',
      subtopicId: 'subtopic-1',
      doubtText: 'Can we revisit async/await?',
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      scheduledAt: new Date('2026-03-22T12:00:00.000Z'),
      createdAt: new Date('2026-03-22T09:00:00.000Z'),
    });

    const response = await PATCH(
      new NextRequest('http://localhost/api/tutorial/faculty/live-sessions/request-1', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'scheduled',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          scheduledAt: '2026-03-22T12:00:00.000Z',
        }),
      }),
      { params: Promise.resolve({ id: 'request-1' }) }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { status: string } };
    expect(body.data.status).toBe('scheduled');
  });
});
