import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssignmentRepository } from '../assignment.repository';

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

describe('AssignmentRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.selectRows = [];
    state.insertRows = [];
    state.updateRows = [];
  });

  it('returns assignments for a subtopic and difficulty', async () => {
    state.selectRows = [
      {
        id: 'assignment-1',
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        questionType: 'mcq',
        question: 'What is a promise?',
        hints: ['Think future value'],
        referenceAnswer: 'A future value placeholder',
        title: 'Promise basics',
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
    ];

    const repository = new AssignmentRepository(createDbMock() as never);
    const result = await repository.getAssignments('subtopic-1', 'simple');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'assignment-1',
      question: 'What is a promise?',
      questionType: 'mcq',
    });
  });

  it('upserts progress by inserting when no record exists', async () => {
    state.selectRows = [];
    state.insertRows = [
      {
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
      },
    ];

    const repository = new AssignmentRepository(createDbMock() as never);
    const result = await repository.upsertProgress('student-1', 'subtopic-1', 'simple', 'in_progress');

    expect(result.id).toBe('progress-1');
    expect(result.status).toBe('in_progress');
  });

  it('upserts progress by updating when a record already exists', async () => {
    state.selectRows = [
      {
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
      },
    ];
    state.updateRows = [
      {
        ...state.selectRows[0],
        status: 'self_completed',
        completedAt: new Date('2026-01-02T00:00:00.000Z'),
        version: 2,
      },
    ];

    const repository = new AssignmentRepository(createDbMock() as never);
    const result = await repository.upsertProgress('student-1', 'subtopic-1', 'simple', 'self_completed');

    expect(result.status).toBe('self_completed');
    expect(result.completedAt).not.toBeNull();
  });

  it('returns tier status from progress rows', async () => {
    state.selectRows = [
      {
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
      },
      {
        id: 'progress-2',
        userId: 'student-1',
        subtopicId: 'subtopic-1',
        difficulty: 'mixed',
        status: 'in_progress',
        startedAt: new Date('2026-01-03T00:00:00.000Z'),
        completedAt: null,
        version: 1,
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        updatedAt: new Date('2026-01-03T00:00:00.000Z'),
        deletedAt: null,
      },
    ];

    const repository = new AssignmentRepository(createDbMock() as never);
    const status = await repository.getTierStatus('student-1', 'subtopic-1');

    expect(status.simple.isUnlocked).toBe(true);
    expect(status.simple.status).toBe('self_completed');
    expect(status.mixed.isUnlocked).toBe(true);
    expect(status.intermediate.isUnlocked).toBe(false);
  });

  it('creates help requests and can query them back', async () => {
    state.insertRows = [
      {
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
      },
    ];
    state.selectRows = state.insertRows;

    const repository = new AssignmentRepository(createDbMock() as never);
    const created = await repository.createHelpRequest({
      userId: 'student-1',
      subtopicId: 'subtopic-1',
      assignmentId: 'assignment-1',
      question: 'Need help',
    });

    const requests = await repository.getHelpRequests({ status: 'open', subtopicId: 'subtopic-1' });

    expect(created.id).toBe('help-1');
    expect(requests).toHaveLength(1);
    expect(requests[0].question).toBe('Need help');
  });
});
