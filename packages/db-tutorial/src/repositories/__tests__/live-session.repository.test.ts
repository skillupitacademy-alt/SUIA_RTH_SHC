import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionRequestInvalidTransitionError, SessionRequestNotFoundError } from '@quiz/types';

import { LiveSessionRepository } from '../live-session.repository';

const state = vi.hoisted(() => ({
  selectRows: [] as Array<Record<string, unknown>>,
  insertRows: [] as Array<Record<string, unknown>>,
  updateRows: [] as Array<Record<string, unknown>>,
}));

function createDbMock() {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => state.selectRows),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => state.insertRows),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => state.updateRows),
        })),
      })),
    })),
  };
}

describe('LiveSessionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.selectRows = [];
    state.insertRows = [];
    state.updateRows = [];
  });

  it('creates a live session request', async () => {
    state.insertRows = [
      {
        id: 'request-1',
        studentId: 'student-1',
        subtopicId: 'subtopic-1',
        doubtText: 'Need help',
        status: 'pending',
        facultyId: null,
        meetingLink: null,
        scheduledAt: null,
        completedAt: null,
        cancelledReason: null,
        deletedAt: null,
        version: 1,
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ];

    const repository = new LiveSessionRepository(createDbMock() as never);
    const result = await repository.createRequest('student-1', 'subtopic-1', 'Need help');

    expect(result.id).toBe('request-1');
    expect(result.status).toBe('pending');
  });

  it('accepts a pending request', async () => {
    state.selectRows = [
      {
        id: 'request-1',
        studentId: 'student-1',
        subtopicId: 'subtopic-1',
        doubtText: 'Need help',
        status: 'pending',
        facultyId: null,
        meetingLink: null,
        scheduledAt: null,
        completedAt: null,
        cancelledReason: null,
        deletedAt: null,
        version: 1,
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ];
    state.updateRows = [
      {
        ...state.selectRows[0],
        status: 'accepted',
        facultyId: 'faculty-1',
        version: 2,
      },
    ];

    const repository = new LiveSessionRepository(createDbMock() as never);
    const result = await repository.acceptRequest('request-1', 'faculty-1');

    expect(result.status).toBe('accepted');
    expect(result.facultyId).toBe('faculty-1');
  });

  it('throws when accepting a non-pending request', async () => {
    state.selectRows = [
      {
        id: 'request-1',
        studentId: 'student-1',
        subtopicId: 'subtopic-1',
        doubtText: null,
        status: 'accepted',
        facultyId: 'faculty-1',
        meetingLink: null,
        scheduledAt: null,
        completedAt: null,
        cancelledReason: null,
        deletedAt: null,
        version: 1,
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ];

    const repository = new LiveSessionRepository(createDbMock() as never);
    await expect(repository.acceptRequest('request-1', 'faculty-1')).rejects.toBeInstanceOf(
      SessionRequestInvalidTransitionError
    );
  });

  it('schedules an accepted request', async () => {
    state.selectRows = [
      {
        id: 'request-1',
        studentId: 'student-1',
        subtopicId: 'subtopic-1',
        doubtText: null,
        status: 'accepted',
        facultyId: 'faculty-1',
        meetingLink: null,
        scheduledAt: null,
        completedAt: null,
        cancelledReason: null,
        deletedAt: null,
        version: 1,
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ];
    state.updateRows = [
      {
        ...state.selectRows[0],
        status: 'scheduled',
        meetingLink: 'https://meet.example.com/session',
        scheduledAt: new Date('2026-03-23T10:00:00.000Z'),
        version: 2,
      },
    ];

    const repository = new LiveSessionRepository(createDbMock() as never);
    const result = await repository.scheduleRequest(
      'request-1',
      new Date('2026-03-23T10:00:00.000Z'),
      'https://meet.example.com/session'
    );

    expect(result.status).toBe('scheduled');
    expect(result.meetingLink).toBe('https://meet.example.com/session');
  });

  it('cancels a request regardless of status', async () => {
    state.selectRows = [
      {
        id: 'request-1',
        studentId: 'student-1',
        subtopicId: 'subtopic-1',
        doubtText: null,
        status: 'pending',
        facultyId: null,
        meetingLink: null,
        scheduledAt: null,
        completedAt: null,
        cancelledReason: null,
        deletedAt: null,
        version: 1,
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ];
    state.updateRows = [
      {
        ...state.selectRows[0],
        status: 'cancelled',
        cancelledReason: 'Cancelled by student',
        version: 2,
      },
    ];

    const repository = new LiveSessionRepository(createDbMock() as never);
    const result = await repository.cancelRequest('request-1', 'Cancelled by student');

    expect(result.status).toBe('cancelled');
    expect(result.cancelledReason).toBe('Cancelled by student');
  });

  it('throws when a request cannot be found', async () => {
    const repository = new LiveSessionRepository(createDbMock() as never);
    await expect(repository.cancelRequest('missing', 'Cancelled by student')).rejects.toBeInstanceOf(
      SessionRequestNotFoundError
    );
  });
});
