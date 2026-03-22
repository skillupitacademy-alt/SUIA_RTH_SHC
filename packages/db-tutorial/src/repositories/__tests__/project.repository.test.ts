import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
}));

vi.mock('@quiz/db', () => ({
  withTimeout: mocks.withTimeout,
  REPORT_QUERY_TIMEOUT: 30_000,
  STANDARD_QUERY_TIMEOUT: 15_000,
}));

import { ProjectRepository } from '../project.repository';
import { badges } from '../../schema/badges';
import { studentBadges } from '../../schema/student-badges';
import { tutorialProjects } from '../../schema/tutorial-projects';
import { tutorialProjectSubmissions } from '../../schema/tutorial-project-submissions';

const projectRow = {
  id: 'project-1',
  scope: 'topic',
  parentId: 'topic-1',
  level: 'simple',
  title: 'Project One',
  description: 'desc',
  deliverableType: 'repo',
  evaluationType: 'ai_review',
  estimatedHours: 4,
  badgeId: 'badge-1',
  subtopicsCovered: ['subtopic-1'],
  prerequisites: [],
  isPublished: true,
  version: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const submissionRow = {
  id: 'submission-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectLevel: 'simple',
  difficulty: 'simple',
  submissionContent: { repoUrl: 'https://github.com/example/repo' },
  status: 'submitted',
  score: null,
  feedback: null,
  aiReview: null,
  peerReviews: [],
  adminReview: null,
  badgeAwarded: false,
  videoRequired: false,
  videoUrl: null,
  submittedAt: new Date('2026-01-02T00:00:00.000Z'),
  gradedAt: null,
  version: 1,
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  deletedAt: null,
};

const badgeRow = {
  id: 'badge-1',
  name: 'Topic Hero',
  description: 'desc',
  iconUrl: null,
  level: 'simple',
  scope: 'topic',
  criteria: null,
  version: 1,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const studentBadgeRow = {
  id: 'student-badge-1',
  userId: 'user-1',
  badgeId: 'badge-1',
  awardedAt: new Date('2026-01-03T00:00:00.000Z'),
  projectSubmissionId: 'submission-1',
  deletedAt: null,
};

const createDbMock = ({
  projectRows = [projectRow],
  submissionRows = [submissionRow],
  badgeRows = [badgeRow],
  studentBadgeRows = [studentBadgeRow],
  insertRow = submissionRow,
  awardRow = studentBadgeRow,
  updateRow = submissionRow,
}: {
  projectRows?: unknown[];
  submissionRows?: unknown[];
  badgeRows?: unknown[];
  studentBadgeRows?: unknown[];
  insertRow?: Record<string, unknown>;
  awardRow?: Record<string, unknown>;
  updateRow?: Record<string, unknown>;
} = {}) => {
  const projectWhere = vi.fn(async () => projectRows);
  const submissionWhere = vi.fn(async () => submissionRows);
  const badgeWhere = vi.fn(async () => badgeRows);
  const studentBadgeWhere = vi.fn(async () => studentBadgeRows);

  const select = vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where:
        table === tutorialProjects
          ? projectWhere
          : table === tutorialProjectSubmissions
            ? submissionWhere
            : table === badges
              ? badgeWhere
              : studentBadges
                ? studentBadgeWhere
                : submissionWhere,
    })),
  }));

  const returningInsert = vi.fn(async () => [insertRow]);
  const onConflictDoNothing = vi.fn(() => ({ returning: returningInsert }));
  const values = vi.fn(() => ({ returning: returningInsert, onConflictDoNothing }));
  const insert = vi.fn((table: unknown) => ({
    values: vi.fn(() => ({ returning: returningInsert, onConflictDoNothing })),
  }));

  const returningUpdate = vi.fn(async () => [updateRow]);
  const whereUpdate = vi.fn(() => ({ returning: returningUpdate }));
  const set = vi.fn(() => ({ where: whereUpdate }));
  const update = vi.fn(() => ({ set }));

  return {
    select,
    projectWhere,
    submissionWhere,
    badgeWhere,
    studentBadgeWhere,
    insert,
    values,
    returningInsert,
    onConflictDoNothing,
    update,
    set,
    whereUpdate,
    returningUpdate,
  } as const;
};

describe('ProjectRepository', () => {
  beforeEach(() => {
    mocks.withTimeout.mockClear();
  });

  it('getProject returns the active project row', async () => {
    const db = createDbMock();
    const repo = new ProjectRepository(db as never);

    await expect(repo.getProject('project-1')).resolves.toEqual(projectRow);
  });

  it('getSubmission returns the active submission row', async () => {
    const db = createDbMock();
    const repo = new ProjectRepository(db as never);

    await expect(repo.getSubmission('submission-1')).resolves.toEqual(submissionRow);
  });

  it('getSubmissionsByUser returns all submissions for the user', async () => {
    const db = createDbMock();
    const repo = new ProjectRepository(db as never);

    await expect(repo.getSubmissionsByUser('user-1')).resolves.toHaveLength(1);
  });

  it('createSubmission inserts a submitted row with badge defaults', async () => {
    const db = createDbMock();
    const repo = new ProjectRepository(db as never);

    await expect(
      repo.createSubmission({
        userId: 'user-1',
        projectId: 'project-1',
        projectLevel: 'simple',
        difficulty: 'simple',
        submissionContent: { repoUrl: 'https://github.com/example/repo' },
      })
    ).resolves.toEqual(submissionRow);

    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('updateSubmissionStatus applies valid transitions', async () => {
    const db = createDbMock({ submissionRows: [submissionRow], updateRow: { ...submissionRow, status: 'ai_reviewing' } });
    const repo = new ProjectRepository(db as never);

    await expect(repo.updateSubmissionStatus('submission-1', 'ai_reviewing')).resolves.toMatchObject({
      status: 'ai_reviewing',
    });
  });

  it('updateSubmissionStatus throws on invalid transitions', async () => {
    const db = createDbMock({ submissionRows: [{ ...submissionRow, status: 'approved' }] });
    const repo = new ProjectRepository(db as never);

    await expect(repo.updateSubmissionStatus('submission-1', 'ai_reviewing')).rejects.toThrow('Invalid project transition');
  });

  it('awardBadge inserts the student badge row', async () => {
    const db = createDbMock({ insertRow: studentBadgeRow, awardRow: studentBadgeRow });
    const repo = new ProjectRepository(db as never);

    await expect(repo.awardBadge('user-1', 'badge-1', 'submission-1')).resolves.toEqual(studentBadgeRow);
  });

  it('getBadgesByUser returns badge rows', async () => {
    const db = createDbMock({ studentBadgeRows: [studentBadgeRow] });
    const repo = new ProjectRepository(db as never);

    await expect(repo.getBadgesByUser('user-1')).resolves.toHaveLength(1);
    expect(mocks.withTimeout).toHaveBeenCalled();
  });

  it('getProjectsByScope returns active scope rows', async () => {
    const db = createDbMock({ projectRows: [projectRow] });
    const repo = new ProjectRepository(db as never);

    await expect(repo.getProjectsByScope('topic', 'topic-1')).resolves.toHaveLength(1);
  });
});
