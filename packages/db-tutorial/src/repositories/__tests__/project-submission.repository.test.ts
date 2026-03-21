import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
}));

vi.mock('@quiz/db', () => ({
  withTimeout: mocks.withTimeout,
  STANDARD_QUERY_TIMEOUT: 15_000,
  REPORT_QUERY_TIMEOUT: 30_000,
}));

import { ProjectSubmissionRepository } from '../project-submission.repository';
import { tutorialProjects } from '../../schema/tutorial-projects';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'submission-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectLevel: 'simple',
  difficulty: 'simple',
  submissionContent: { answer: 'done' },
  status: 'pending',
  score: null,
  feedback: null,
  videoRequired: false,
  videoUrl: null,
  submittedAt: new Date('2026-01-01T00:00:00.000Z'),
  gradedAt: null,
  version: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

const createDbMock = ({
  submissionRows = [makeRow()],
  projectRows = [{ level: 'simple' }],
  insertRow = makeRow(),
  updateRow = makeRow(),
}: {
  submissionRows?: unknown[];
  projectRows?: unknown[];
  insertRow?: Record<string, unknown>;
  updateRow?: Record<string, unknown>;
} = {}) => {
  const submissionWhere = vi.fn(async () => submissionRows);
  const projectWhere = vi.fn(async () => projectRows);
  const select = vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: table === tutorialProjects ? projectWhere : submissionWhere,
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
    submissionWhere,
    projectWhere,
    insert,
    values,
    returningInsert,
    update,
    set,
    returningUpdate,
    submissionRows,
    projectRows,
    insertRow,
    updateRow,
  } as const;
};

describe('ProjectSubmissionRepository', () => {
  beforeEach(() => {
    mocks.withTimeout.mockClear();
  });

  it('submit inserts a pending submission with defaults', async () => {
    const db = createDbMock();
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(
      repo.submit({
        userId: 'user-1',
        projectId: 'project-1',
        projectLevel: 'simple',
        difficulty: 'simple',
        submissionContent: { answer: 'done' },
      })
    ).resolves.toEqual(db.insertRow);

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        videoRequired: false,
        deletedAt: null,
      })
    );
  });

  it('withDb returns a cloned repository instance', () => {
    const db = createDbMock();
    const repo = new ProjectSubmissionRepository(db as never);
    const cloned = repo.withDb(db as never);

    expect(cloned).toBeInstanceOf(ProjectSubmissionRepository);
    expect(cloned).not.toBe(repo);
  });

  it('findById returns the current submission row', async () => {
    const db = createDbMock();
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.findById('submission-1')).resolves.toEqual(db.submissionRows[0]);
  });

  it('findById returns undefined when the submission is missing', async () => {
    const db = createDbMock({ submissionRows: [] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.findById('missing')).resolves.toBeUndefined();
  });

  it('grade marks a submission as graded with score and feedback', async () => {
    const graded = makeRow({
      status: 'graded',
      score: 95,
      feedback: 'Well done',
      gradedAt: new Date('2026-01-03T00:00:00.000Z'),
    });
    const db = createDbMock({ submissionRows: [graded], updateRow: graded });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.grade('submission-1', 95, 'Well done')).resolves.toEqual(graded);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 95,
        feedback: 'Well done',
        status: 'graded',
        deletedAt: null,
      })
    );
  });

  it('getByUser filters by user and optional level', async () => {
    const db = createDbMock({ submissionRows: [makeRow({ userId: 'user-1' })] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.getByUser('user-1', 'simple')).resolves.toHaveLength(1);
  });

  it('getByUser works without a level filter', async () => {
    const db = createDbMock({ submissionRows: [makeRow({ userId: 'user-1' })] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.getByUser('user-1')).resolves.toHaveLength(1);
  });

  it('getPending uses the report timeout and filters by project', async () => {
    const db = createDbMock({ submissionRows: [makeRow()] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.getPending('project-1')).resolves.toHaveLength(1);
    expect(mocks.withTimeout).toHaveBeenCalledWith(
      expect.any(Promise),
      30_000,
      'ProjectSubmissionRepository.getPending'
    );
  });

  it('getPending works without a project filter', async () => {
    const db = createDbMock({ submissionRows: [makeRow()] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.getPending()).resolves.toHaveLength(1);
  });

  it('requiresVideo returns true for non-simple difficulty', async () => {
    const db = createDbMock({ projectRows: [{ level: 'simple' }] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.requiresVideo('project-1', 'mixed')).resolves.toBe(true);
    expect(mocks.withTimeout).toHaveBeenCalledWith(
      expect.any(Promise),
      15_000,
      'ProjectSubmissionRepository.requiresVideo'
    );
  });

  it('requiresVideo returns true when the project level is not simple', async () => {
    const db = createDbMock({ projectRows: [{ level: 'intermediate' }] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.requiresVideo('project-1', 'simple')).resolves.toBe(true);
  });

  it('requiresVideo returns false for a simple project with simple difficulty', async () => {
    const db = createDbMock({ projectRows: [{ level: 'simple' }] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.requiresVideo('project-1', 'simple')).resolves.toBe(false);
  });

  it('requiresVideo falls back to difficulty when the project is missing', async () => {
    const db = createDbMock({ projectRows: [] });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.requiresVideo('project-404', 'simple')).resolves.toBe(false);
  });

  it('softDelete stamps deletedAt without removing the row', async () => {
    const deleted = makeRow({ deletedAt: new Date('2026-01-04T00:00:00.000Z') });
    const db = createDbMock({ updateRow: deleted });
    const repo = new ProjectSubmissionRepository(db as never);

    await expect(repo.softDelete('submission-1')).resolves.toEqual(deleted);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
      })
    );
  });
});
