import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakeTx = {};

vi.mock('@quiz/db-tutorial', () => ({
  db: {
    transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx)),
  },
  ProjectRepository: class {},
  TutorialProgressRepository: class {},
}));

import { ProjectService } from '../project.service';
import { ProjectNotEligibleError } from '@quiz/types';

const createProjectRepository = (overrides: Record<string, unknown> = {}) => ({
  getProject: vi.fn(async () => ({
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
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  })),
  getSubmissionsByUser: vi.fn(async () => []),
  getSubmission: vi.fn(async () => ({
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
    submittedAt: new Date(),
    gradedAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  })),
  createSubmission: vi.fn(async () => ({ id: 'submission-1' })),
  withDb: vi.fn(function () { return this; }),
  getProjectsByScope: vi.fn(async () => []),
  updateSubmissionStatus: vi.fn(async (_id: string, status: string) => ({ id: 'submission-1', status })),
  awardBadge: vi.fn(async () => ({ id: 'student-badge-1' })),
  getBadgesByUser: vi.fn(async () => []),
  ...overrides,
});

const createProgressRepository = (complete = true) => ({
  isSubtopicComplete: vi.fn(async () => complete),
});

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submitProject creates a submission, sets idempotency, and enqueues review', async () => {
    const projectRepository = createProjectRepository();
    const progressRepository = createProgressRepository(true);
    const redis = {
      get: vi.fn(async () => null),
      set: vi.fn(async () => 'OK'),
    };
    const qstash = {
      publishJSON: vi.fn(async () => ({ messageId: 'msg-1' })),
    };

    const service = new ProjectService({
      projectRepository: projectRepository as never,
      progressRepository: progressRepository as never,
      getRedis: () => redis,
      getQStash: () => qstash,
      appUrl: 'https://tutorial.example.com',
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(
      service.submitProject('user-1', 'project-1', { repoUrl: 'https://github.com/example/repo' })
    ).resolves.toEqual({ submissionId: 'submission-1' });

    expect(projectRepository.createSubmission).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith('project-submit:user-1:project-1', 'submission-1', expect.any(Object));
    expect(qstash.publishJSON).toHaveBeenCalledTimes(1);
  });

  it('submitProject throws when the content flow is incomplete', async () => {
    const projectRepository = createProjectRepository();
    const progressRepository = createProgressRepository(false);

    const service = new ProjectService({
      projectRepository: projectRepository as never,
      progressRepository: progressRepository as never,
      getRedis: () => ({ get: vi.fn(), set: vi.fn() } as never),
      getQStash: () => ({ publishJSON: vi.fn() } as never),
    });

    await expect(
      service.submitProject('user-1', 'project-1', { repoUrl: 'https://github.com/example/repo' })
    ).rejects.toBeInstanceOf(ProjectNotEligibleError);
  });

  it('submitProject returns the existing submission when the idempotency key exists', async () => {
    const projectRepository = createProjectRepository({
      getSubmissionsByUser: vi.fn(async () => [{ id: 'submission-1', projectId: 'project-1' }]),
    });
    const progressRepository = createProgressRepository(true);
    const redis = {
      get: vi.fn(async () => 'submission-1'),
      set: vi.fn(async () => 'OK'),
    };

    const service = new ProjectService({
      projectRepository: projectRepository as never,
      progressRepository: progressRepository as never,
      getRedis: () => redis,
      getQStash: () => ({ publishJSON: vi.fn() } as never),
    });

    await expect(
      service.submitProject('user-1', 'project-1', { repoUrl: 'https://github.com/example/repo' })
    ).resolves.toEqual({ submissionId: 'submission-1' });
  });

  it('getProject returns project and submission data', async () => {
    const projectRepository = createProjectRepository();
    projectRepository.getSubmissionsByUser = vi.fn(async () => ([
      {
        id: 'submission-1',
        projectId: 'project-1',
      },
    ]));
    const service = new ProjectService({
      projectRepository: projectRepository as never,
      progressRepository: createProgressRepository(true) as never,
      getRedis: () => ({ get: vi.fn(), set: vi.fn() } as never),
      getQStash: () => ({ publishJSON: vi.fn() } as never),
    });

    await expect(service.getProject('project-1', 'user-1')).resolves.toMatchObject({
      project: expect.objectContaining({ id: 'project-1' }),
      submission: expect.objectContaining({ id: 'submission-1' }),
    });
  });

  it('getMyProjects returns all submissions for a user', async () => {
    const projectRepository = createProjectRepository({
      getSubmissionsByUser: vi.fn(async () => [{ id: 'submission-1' }]),
    });
    const service = new ProjectService({
      projectRepository: projectRepository as never,
      progressRepository: createProgressRepository(true) as never,
      getRedis: () => ({ get: vi.fn(), set: vi.fn() } as never),
      getQStash: () => ({ publishJSON: vi.fn() } as never),
    });

    await expect(service.getMyProjects('user-1')).resolves.toHaveLength(1);
  });

  it('checkCertificateEligibility returns eligible when the required project is approved', async () => {
    const projectRepository = createProjectRepository({
      getProjectsByScope: vi.fn(async () => [{ ...await createProjectRepository().getProject('project-1'), level: 'simple' }]),
      getSubmissionsByUser: vi.fn(async () => [{ id: 'submission-1', projectId: 'project-1', status: 'approved' }]),
    });
    const service = new ProjectService({
      projectRepository: projectRepository as never,
      progressRepository: createProgressRepository(true) as never,
      getRedis: () => ({ get: vi.fn(), set: vi.fn() } as never),
      getQStash: () => ({ publishJSON: vi.fn() } as never),
    });

    await expect(service.checkCertificateEligibility('user-1', 'topic', 'topic-1')).resolves.toEqual({
      eligible: true,
      missingRequirements: [],
    });
  });
});
