import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
}));

vi.mock('@quiz/db', () => ({
  withTimeout: mocks.withTimeout,
  STANDARD_QUERY_TIMEOUT: 15_000,
  REPORT_QUERY_TIMEOUT: 30_000,
}));

import { TutorialProgressRepository } from '../tutorial-progress.repository';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'progress-1',
  userId: 'user-1',
  subtopicId: 'subtopic-1',
  status: 'in_progress',
  blocksCompleted: ['notes', 'layman'],
  remediationTriggered: false,
  score: null,
  timeSpentSec: 0,
  completedAt: null,
  version: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

const createDbMock = ({
  selectRows = [makeRow()],
  insertRow = makeRow(),
  updateRow = makeRow(),
}: {
  selectRows?: unknown[];
  insertRow?: Record<string, unknown>;
  updateRow?: Record<string, unknown>;
} = {}) => {
  const where = vi.fn(async () => selectRows);
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where,
    })),
  }));

  const returningInsert = vi.fn(async () => [insertRow]);
  const values = vi.fn(() => ({ returning: returningInsert }));
  const insert = vi.fn(() => ({ values }));

  const returningUpdate = vi.fn(async () => [updateRow]);
  const set = vi.fn(() => ({ where: vi.fn(() => ({ returning: returningUpdate })) }));
  const update = vi.fn(() => ({ set }));

  return {
    select,
    where,
    insert,
    values,
    returningInsert,
    update,
    set,
    returningUpdate,
    selectRows,
    insertRow,
    updateRow,
  } as const;
};

describe('TutorialProgressRepository', () => {
  beforeEach(() => {
    mocks.withTimeout.mockClear();
  });

  it('findById returns the active progress row', async () => {
    const db = createDbMock();
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.findById('progress-1')).resolves.toEqual(db.selectRows[0] ?? undefined);
    expect(mocks.withTimeout).toHaveBeenCalledWith(
      expect.any(Promise),
      15_000,
      'TutorialProgressRepository.findById'
    );
  });

  it('withDb returns a cloned repository instance', () => {
    const db = createDbMock();
    const repo = new TutorialProgressRepository(db as never);
    const cloned = repo.withDb(db as never);

    expect(cloned).toBeInstanceOf(TutorialProgressRepository);
    expect(cloned).not.toBe(repo);
  });

  it('getProgress returns the current progress row', async () => {
    const db = createDbMock();
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.getProgress('user-1', 'subtopic-1')).resolves.toEqual(db.selectRows[0] ?? undefined);
  });

  it('markBlockComplete inserts a new row when none exists', async () => {
    const inserted = makeRow({
      id: 'progress-new',
      blocksCompleted: ['technical'],
      status: 'in_progress',
    });
    const db = createDbMock({ selectRows: [], insertRow: inserted });
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.markBlockComplete('user-1', 'subtopic-1', 'technical')).resolves.toEqual(inserted);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        subtopicId: 'subtopic-1',
        blocksCompleted: ['technical'],
        status: 'in_progress',
        deletedAt: null,
      })
    );
  });

  it('markBlockComplete completes the subtopic once all blocks are present', async () => {
    const existing = makeRow({
      blocksCompleted: ['notes', 'layman', 'real_life', 'technical', 'code'],
    });
    const completed = makeRow({
      status: 'completed',
      blocksCompleted: ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'],
      completedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const db = createDbMock({ selectRows: [existing], updateRow: completed });
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.markBlockComplete('user-1', 'subtopic-1', 'ai_tutor')).resolves.toEqual(completed);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        completedAt: expect.any(Date),
        deletedAt: null,
      })
    );
  });

  it('isSubtopicComplete returns false until every required block is done', async () => {
    const db = createDbMock({ selectRows: [makeRow({ blocksCompleted: ['notes', 'layman'] })] });
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.isSubtopicComplete('user-1', 'subtopic-1')).resolves.toBe(false);
  });

  it('isSubtopicComplete returns true when all required blocks are done', async () => {
    const completed = makeRow({
      blocksCompleted: ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'],
      status: 'completed',
    });
    const db = createDbMock({ selectRows: [completed] });
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.isSubtopicComplete('user-1', 'subtopic-1')).resolves.toBe(true);
  });

  it('getCompletedSubtopics uses the report timeout path', async () => {
    const db = createDbMock({
      selectRows: [{ subtopicId: 'subtopic-1' }, { subtopicId: 'subtopic-2' }],
    });
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.getCompletedSubtopics('user-1')).resolves.toEqual(['subtopic-1', 'subtopic-2']);
    expect(mocks.withTimeout).toHaveBeenCalledWith(
      expect.any(Promise),
      30_000,
      'TutorialProgressRepository.getCompletedSubtopics'
    );
  });

  it('resetProgress clears progress without hard deleting the record', async () => {
    const reset = makeRow({
      status: 'not_started',
      blocksCompleted: [],
      score: null,
      completedAt: null,
    });
    const db = createDbMock({ selectRows: [makeRow()], updateRow: reset });
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.resetProgress('user-1', 'subtopic-1')).resolves.toEqual(reset);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'not_started',
        blocksCompleted: [],
        remediationTriggered: false,
        deletedAt: null,
      })
    );
  });

  it('resetProgress inserts a fresh row when none exists', async () => {
    const created = makeRow({
      id: 'progress-new',
      status: 'not_started',
      blocksCompleted: [],
    });
    const db = createDbMock({ selectRows: [], insertRow: created });
    const repo = new TutorialProgressRepository(db as never);

    await expect(repo.resetProgress('user-1', 'subtopic-1')).resolves.toEqual(created);
  });
});
