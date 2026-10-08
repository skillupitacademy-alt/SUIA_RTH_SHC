import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

const mocks = vi.hoisted(() => ({
  resolveFacultyAccess: vi.fn(),
  loadFacultyAssignments: vi.fn(),
}));

vi.mock('@/lib/tutorial-faculty-access', () => ({
  resolveFacultyAccess: mocks.resolveFacultyAccess,
  loadFacultyAssignments: mocks.loadFacultyAssignments,
}));

describe('GET /api/tutorial/faculty/assignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when faculty auth is missing', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce(null);

    const response = await GET(new NextRequest('http://localhost/api/tutorial/faculty/assignments'));

    expect(response.status).toBe(401);
  });

  it('returns assignments when faculty auth is valid', async () => {
    mocks.resolveFacultyAccess.mockResolvedValueOnce({ facultyId: 'faculty-1', userId: 'user-1' });
    mocks.loadFacultyAssignments.mockResolvedValueOnce([
      {
        id: 'assignment-1',
        title: 'Arrays and loops',
        question: 'Solve the loop challenge',
        subtopic: 'JavaScript basics',
        difficulty: 'simple',
        questionType: 'short_answer',
        points: 10,
        isPublished: true,
        helpRequestCount: 2,
        createdAt: new Date('2026-03-01T10:00:00.000Z').toISOString(),
        updatedAt: new Date('2026-03-01T10:00:00.000Z').toISOString(),
      },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/tutorial/faculty/assignments'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    const body = (await response.json()) as { data: Array<{ id: string; title: string }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.title).toBe('Arrays and loops');
  });
});
