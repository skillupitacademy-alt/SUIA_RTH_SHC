import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '../route';

const mocks = vi.hoisted(() => ({
  resolveFacultyAccess: vi.fn(),
  listFacultyBatchOptions: vi.fn(),
  createFacultyBatchSession: vi.fn(),
}));

vi.mock('@/lib/tutorial-faculty-access', () => ({
  resolveFacultyAccess: mocks.resolveFacultyAccess,
  listFacultyBatchOptions: mocks.listFacultyBatchOptions,
  createFacultyBatchSession: mocks.createFacultyBatchSession,
}));

describe('GET /api/faculty/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without faculty auth', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce(null);

    const response = await GET(new NextRequest('http://localhost/api/faculty/sessions'));
    expect(response.status).toBe(401);
  });

  it('returns batch options for the faculty', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce({ facultyId: 'faculty-1', userId: 'user-1' });
    mocks.listFacultyBatchOptions.mockResolvedValueOnce([{ id: 'batch-1', name: 'React', nextSessionAt: '2026-03-22T10:00:00.000Z' }]);

    const response = await GET(new NextRequest('http://localhost/api/faculty/sessions'));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Array<{ id: string }> };
    expect(body.data).toHaveLength(1);
  });
});

describe('POST /api/faculty/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a session', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce({ facultyId: 'faculty-1', userId: 'user-1' });
    mocks.createFacultyBatchSession.mockResolvedValueOnce({
      id: 'session-1',
      batchId: 'batch-1',
      scheduledAt: new Date('2026-03-22T12:00:00.000Z'),
      durationMinutes: 90,
      sessionNotes: 'React patterns',
      status: 'scheduled',
    });

    const response = await POST(
      new NextRequest('http://localhost/api/faculty/sessions', {
        method: 'POST',
        body: JSON.stringify({
          batchId: 'batch-1',
          scheduledAt: '2026-03-22T12:00:00.000Z',
          durationMinutes: 90,
          sessionNotes: 'React patterns',
        }),
      })
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as { data: { id: string } };
    expect(body.data.id).toBe('session-1');
  });
});
