import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '../route';

const mocks = vi.hoisted(() => ({
  resolveFacultyAccess: vi.fn(),
  getFacultyAttendanceRoster: vi.fn(),
  upsertFacultyAttendance: vi.fn(),
}));

vi.mock('@/lib/tutorial-faculty-access', () => ({
  resolveFacultyAccess: mocks.resolveFacultyAccess,
  getFacultyAttendanceRoster: mocks.getFacultyAttendanceRoster,
  upsertFacultyAttendance: mocks.upsertFacultyAttendance,
}));

describe('GET /api/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without faculty auth', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce(null);

    const response = await GET(new NextRequest('http://localhost/api/attendance?batchId=batch-1&sessionId=session-1'));

    expect(response.status).toBe(401);
  });

  it('returns a roster when authorized', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce({ facultyId: 'faculty-1', userId: 'user-1' });
    mocks.getFacultyAttendanceRoster.mockResolvedValueOnce({
      batchId: 'batch-1',
      batchName: 'Batch One',
      sessionId: 'session-1',
      sessionAt: new Date('2026-03-10T10:00:00.000Z').toISOString(),
      roster: [
        { id: 'student-1', name: 'Asha', rollNumber: 'SK001', avatarUrl: 'avatar', present: true },
      ],
    });

    const response = await GET(new NextRequest('http://localhost/api/attendance?batchId=batch-1&sessionId=session-1'));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { batchId: string; roster: Array<{ name: string }> } };
    expect(body.data.batchId).toBe('batch-1');
    expect(body.data.roster).toHaveLength(1);
  });
});

describe('POST /api/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists attendance marks when authorized', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce({ facultyId: 'faculty-1', userId: 'user-1' });
    mocks.upsertFacultyAttendance.mockResolvedValueOnce(1);

    const response = await POST(
      new NextRequest('http://localhost/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          batchId: 'batch-1',
          sessionId: 'session-1',
          attendanceRecords: [{ studentId: 'student-1', present: true }],
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { saved: number } };
    expect(body.data.saved).toBe(1);
  });
});
