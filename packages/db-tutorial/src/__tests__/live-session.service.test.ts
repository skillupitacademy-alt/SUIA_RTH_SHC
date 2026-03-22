import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionRequestDuplicateError, SessionRequestForbiddenError } from '@quiz/types';

const mocks = vi.hoisted(() => ({
  dbTransaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({})),
  publishJSON: vi.fn(),
  repository: {
    withDb: vi.fn().mockReturnThis(),
    getRequestsByStudent: vi.fn(),
    getRequest: vi.fn(),
    createRequest: vi.fn(),
    cancelRequest: vi.fn(),
    getPendingRequests: vi.fn(),
    acceptRequest: vi.fn(),
    scheduleRequest: vi.fn(),
    completeRequest: vi.fn(),
  },
}));

vi.mock('../db', () => ({
  db: {
    transaction: mocks.dbTransaction,
  },
}));

vi.mock('../repositories', () => ({
  LiveSessionRepository: class {
    withDb = mocks.repository.withDb;
    getRequestsByStudent = mocks.repository.getRequestsByStudent;
    getRequest = mocks.repository.getRequest;
    createRequest = mocks.repository.createRequest;
    cancelRequest = mocks.repository.cancelRequest;
    getPendingRequests = mocks.repository.getPendingRequests;
    acceptRequest = mocks.repository.acceptRequest;
    scheduleRequest = mocks.repository.scheduleRequest;
    completeRequest = mocks.repository.completeRequest;
  },
}));

import { LiveSessionService } from '../live-session.service';

describe('LiveSessionService', () => {
  const service = new LiveSessionService({
    liveSessionRepository: mocks.repository as never,
    getQStash: () => ({ publishJSON: mocks.publishJSON }),
    appUrl: 'https://tutorial.example.com',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repository.withDb.mockReturnThis();
    mocks.repository.getRequestsByStudent.mockResolvedValue([]);
    mocks.repository.getRequest.mockResolvedValue(undefined);
    mocks.repository.createRequest.mockResolvedValue({
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
    });
    mocks.repository.cancelRequest.mockResolvedValue({
      id: 'request-1',
      studentId: 'student-1',
      subtopicId: 'subtopic-1',
      doubtText: 'Need help',
      status: 'cancelled',
      facultyId: null,
      meetingLink: null,
      scheduledAt: null,
      completedAt: null,
      cancelledReason: 'Cancelled by student',
      deletedAt: null,
      version: 2,
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    });
    mocks.repository.acceptRequest.mockResolvedValue({
      id: 'request-1',
      studentId: 'student-1',
      subtopicId: 'subtopic-1',
      doubtText: 'Need help',
      status: 'accepted',
      facultyId: 'faculty-1',
      meetingLink: null,
      scheduledAt: null,
      completedAt: null,
      cancelledReason: null,
      deletedAt: null,
      version: 2,
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    });
    mocks.repository.scheduleRequest.mockResolvedValue({
      id: 'request-1',
      studentId: 'student-1',
      subtopicId: 'subtopic-1',
      doubtText: 'Need help',
      status: 'scheduled',
      facultyId: 'faculty-1',
      meetingLink: 'https://meet.example.com/session',
      scheduledAt: new Date('2026-03-23T10:00:00.000Z'),
      completedAt: null,
      cancelledReason: null,
      deletedAt: null,
      version: 3,
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    });
    mocks.repository.completeRequest.mockResolvedValue({
      id: 'request-1',
      studentId: 'student-1',
      subtopicId: 'subtopic-1',
      doubtText: 'Need help',
      status: 'completed',
      facultyId: 'faculty-1',
      meetingLink: 'https://meet.example.com/session',
      scheduledAt: new Date('2026-03-23T10:00:00.000Z'),
      completedAt: new Date('2026-03-23T11:00:00.000Z'),
      cancelledReason: null,
      deletedAt: null,
      version: 4,
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    });
    mocks.publishJSON.mockResolvedValue({ messageId: 'msg-1' });
  });

  it('creates a session request and enqueues a notification', async () => {
    const result = await service.requestSession('student-1', 'subtopic-1', 'Need help');

    expect(result.id).toBe('request-1');
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://tutorial.example.com/api/workers/notify-session-requested',
        retries: 3,
      })
    );
  });

  it('rejects duplicate open requests', async () => {
    mocks.repository.getRequestsByStudent
      .mockResolvedValueOnce([
        {
          id: 'request-dup',
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
      ])
      .mockResolvedValueOnce([]);

    await expect(service.requestSession('student-1', 'subtopic-1', 'Need help')).rejects.toBeInstanceOf(
      SessionRequestDuplicateError
    );
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
    expect(mocks.publishJSON).not.toHaveBeenCalled();
  });

  it('cancels the student request only for the owner', async () => {
    mocks.repository.getRequest.mockResolvedValueOnce({
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
    });

    const result = await service.cancelMyRequest('student-1', 'request-1');

    expect(result.status).toBe('cancelled');
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
  });

  it('throws when a different student tries to cancel a request', async () => {
    mocks.repository.getRequest.mockResolvedValueOnce({
      id: 'request-1',
      studentId: 'student-2',
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
    });

    await expect(service.cancelMyRequest('student-1', 'request-1')).rejects.toBeInstanceOf(
      SessionRequestForbiddenError
    );
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it('accepts a request and enqueues the accepted notification', async () => {
    mocks.repository.getRequest.mockResolvedValueOnce({
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
    });

    const result = await service.acceptRequest('faculty-1', 'request-1');

    expect(result.status).toBe('accepted');
    expect(mocks.publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://tutorial.example.com/api/workers/notify-session-accepted',
      })
    );
  });

  it('rejects invalid meeting links', async () => {
    await expect(
      service.scheduleRequest('faculty-1', 'request-1', new Date('2026-03-23T10:00:00.000Z'), 'not-a-url')
    ).rejects.toThrow('Invalid meeting link');
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it('schedules a request and enqueues the scheduled notification', async () => {
    mocks.repository.getRequest.mockResolvedValueOnce({
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
    });

    const result = await service.scheduleRequest(
      'faculty-1',
      'request-1',
      new Date('2026-03-23T10:00:00.000Z'),
      'https://meet.example.com/session'
    );

    expect(result.status).toBe('scheduled');
    expect(mocks.publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://tutorial.example.com/api/workers/notify-session-scheduled',
      })
    );
  });

  it('completes a scheduled request', async () => {
    mocks.repository.getRequest.mockResolvedValueOnce({
      id: 'request-1',
      studentId: 'student-1',
      subtopicId: 'subtopic-1',
      doubtText: null,
      status: 'scheduled',
      facultyId: 'faculty-1',
      meetingLink: 'https://meet.example.com/session',
      scheduledAt: new Date('2026-03-23T10:00:00.000Z'),
      completedAt: null,
      cancelledReason: null,
      deletedAt: null,
      version: 1,
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    });

    const result = await service.completeRequest('faculty-1', 'request-1');

    expect(result.status).toBe('completed');
    expect(mocks.publishJSON).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://tutorial.example.com/api/workers/notify-session-scheduled' })
    );
  });
});
