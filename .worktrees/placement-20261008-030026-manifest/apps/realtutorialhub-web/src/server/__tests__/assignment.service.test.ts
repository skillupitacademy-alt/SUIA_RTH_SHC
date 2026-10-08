import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssignmentRepository, TutorialProgressRepository } from '@quiz/db-tutorial';

const mocks = vi.hoisted(() => {
  return {
    dbTransaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({})),
    publishEvent: vi.fn(),
  };
});

vi.mock('@quiz/db-tutorial', () => ({
  db: {
    transaction: mocks.dbTransaction,
  },
}));

vi.mock('@quiz/events', () => ({
  publishEvent: mocks.publishEvent,
}));

import { AssignmentTierAlreadyCompletedError, AssignmentTierLockedError } from '@quiz/types';

import { AssignmentService } from '../assignment.service';

describe('AssignmentService', () => {
  type AssignmentRepositoryInstance = InstanceType<typeof AssignmentRepository>;
  type TutorialProgressRepositoryInstance = InstanceType<typeof TutorialProgressRepository>;

  const assignmentsRepository = {
    getAssignments: vi.fn(),
    getProgress: vi.fn(),
    getTierStatus: vi.fn(),
    createHelpRequest: vi.fn(),
    withDb: vi.fn().mockReturnThis(),
    upsertProgress: vi.fn(),
  } as unknown as Pick<
    AssignmentRepositoryInstance,
    'getAssignments' | 'getProgress' | 'getTierStatus' | 'createHelpRequest' | 'withDb' | 'upsertProgress'
  >;

  const progressRepository = {
    isSubtopicComplete: vi.fn(),
  } as unknown as Pick<TutorialProgressRepositoryInstance, 'isSubtopicComplete'>;

  const service = new AssignmentService({
    assignmentRepository: assignmentsRepository,
    progressRepository,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.publishEvent.mockResolvedValue({ messageId: 'msg-1', envelope: {} as never });
  });

  it('returns locked for simple tier when content flow is incomplete', async () => {
    progressRepository.isSubtopicComplete.mockResolvedValueOnce(false);
    assignmentsRepository.getTierStatus.mockResolvedValueOnce({
      simple: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
      mixed: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
      intermediate: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
      expert: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
    });

    const result = await service.getAssignmentsForSubtopic('student-1', 'subtopic-1', 'simple');

    expect(result.locked).toBe(true);
    expect(result.requiredTier).toBe('content_flow');
  });

  it('starts a tier when prerequisites are met', async () => {
    progressRepository.isSubtopicComplete.mockResolvedValueOnce(true);
    assignmentsRepository.getProgress.mockResolvedValueOnce(undefined);
    assignmentsRepository.upsertProgress.mockResolvedValueOnce({
      id: 'progress-1',
      userId: 'student-1',
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
      status: 'in_progress',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: null,
      version: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
    });

    const result = await service.startTier('student-1', 'subtopic-1', 'simple');

    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('in_progress');
  });

  it('throws when starting a locked tier', async () => {
    progressRepository.isSubtopicComplete.mockResolvedValueOnce(false);

    await expect(service.startTier('student-1', 'subtopic-1', 'simple')).rejects.toBeInstanceOf(
      AssignmentTierLockedError
    );
  });

  it('throws when starting an already completed tier', async () => {
    progressRepository.isSubtopicComplete.mockResolvedValueOnce(true);
    assignmentsRepository.getProgress.mockResolvedValueOnce({
      id: 'progress-1',
      userId: 'student-1',
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
      status: 'self_completed',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: new Date('2026-01-02T00:00:00.000Z'),
      version: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      deletedAt: null,
    });

    await expect(service.startTier('student-1', 'subtopic-1', 'simple')).rejects.toBeInstanceOf(
      AssignmentTierAlreadyCompletedError
    );
  });

  it('completes a tier and returns the next unlocked tier', async () => {
    assignmentsRepository.getProgress.mockResolvedValueOnce(undefined);
    assignmentsRepository.upsertProgress.mockResolvedValueOnce({
      id: 'progress-2',
      userId: 'student-1',
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
      status: 'self_completed',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: new Date('2026-01-02T00:00:00.000Z'),
      version: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      deletedAt: null,
    });

    const result = await service.completeTier('student-1', 'subtopic-1', 'simple');

    expect(result.nextUnlockedTier).toBe('mixed');
    expect(result.progress.status).toBe('self_completed');
  });

  it('creates help requests for valid assignments', async () => {
    assignmentsRepository.getAssignments.mockResolvedValueOnce([
      {
        id: 'assignment-1',
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        questionType: 'mcq',
        question: 'Need help',
        hints: [],
        referenceAnswer: 'Answer',
        title: 'Prompt',
        content: {},
        orderIndex: 1,
        points: 10,
        timeLimitSec: null,
        isPublished: true,
        version: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
      },
    ]);
    assignmentsRepository.createHelpRequest.mockResolvedValueOnce({
      id: 'help-1',
      userId: 'student-1',
      subtopicId: 'subtopic-1',
      assignmentId: 'assignment-1',
      question: 'Need help',
      status: 'open',
      assignedTo: null,
      resolvedAt: null,
      version: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
    });

    const request = await service.submitHelpRequest('student-1', 'subtopic-1', 'assignment-1', 'Need help');

    expect(request.id).toBe('help-1');
    expect(mocks.publishEvent).toHaveBeenCalled();
  });
});
