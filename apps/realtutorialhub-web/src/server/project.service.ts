import { Client } from '@upstash/qstash';
import { Redis } from '@upstash/redis';

import { db, ProjectRepository, TutorialProgressRepository } from '@quiz/db-tutorial';
import type {
  ProjectEligibilityResult,
  ProjectLevel,
  ProjectRecord,
  ProjectScope,
  ProjectSubmissionRecord,
} from '@quiz/types';
import { ProjectNotEligibleError } from '@quiz/types';

import { logger } from '@/lib/logger';

type RedisLike = {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown;
};

type QStashLike = {
  publishJSON(args: { url: string; body: unknown; headers?: Record<string, string>; retries?: number }): Promise<unknown>;
};

export interface ProjectDeliverable {
  [key: string]: unknown;
}

export interface ProjectServiceDependencies {
  projectRepository?: ProjectRepository;
  progressRepository?: TutorialProgressRepository;
  getRedis?: () => RedisLike;
  getQStash?: () => QStashLike;
  logger?: typeof logger;
  appUrl?: string;
  now?: () => Date;
}

export interface ProjectSubmissionResult {
  submissionId: string;
}

export interface ProjectViewResult {
  project: ProjectRecord | undefined;
  submission: ProjectSubmissionRecord | undefined;
}

const getAppUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
  const internalUrl = process.env.INTERNAL_API_URL;
  if (typeof publicUrl === 'string' && publicUrl.trim().length > 0) return publicUrl.trim();
  if (typeof internalUrl === 'string' && internalUrl.trim().length > 0) return internalUrl.trim();
  return 'https://user.realtutorialhub.com';
};

const getQStashClient = (): QStashLike => {
  const token = process.env.QSTASH_TOKEN;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required for project workflows');
  }

  return new Client({ token });
};

const getRedisClient = (): RedisLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (
    typeof url !== 'string' || url.trim().length === 0 ||
    typeof token !== 'string' || token.trim().length === 0
  ) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }

  return new Redis({ url, token });
};

const DEFAULT_REVIEW_WORKER_PATH = '/api/workers/review-project';

const buildWorkerUrl = (appUrl: string, path: string) => new URL(path, appUrl).toString();

const hasRequiredDeliverable = (project: ProjectRecord, deliverable: ProjectDeliverable) => {
  if (project.deliverableType === 'repo') {
    return Boolean(deliverable.repoUrl ?? deliverable.repositoryUrl ?? deliverable.url);
  }
  if (project.deliverableType === 'live_demo') {
    return Boolean(deliverable.liveDemoUrl ?? deliverable.demoUrl ?? deliverable.url);
  }
  if (project.deliverableType === 'document') {
    return Boolean(deliverable.documentUrl ?? deliverable.docUrl ?? deliverable.url);
  }
  return Object.keys(deliverable).length > 0;
};

const getRequiredLevel = (scope: ProjectScope): ProjectLevel =>
  scope === 'topic' ? 'simple' : scope === 'subject' ? 'intermediate' : 'expert';

export class ProjectService {
  private readonly projectRepository: ProjectRepository;

  private readonly progressRepository: TutorialProgressRepository;

  private readonly getRedis: () => RedisLike;

  private readonly getQStash: () => QStashLike;

  private readonly log: typeof logger;

  private readonly appUrl: string;

  private readonly now: () => Date;

  constructor(dependencies: ProjectServiceDependencies = {}) {
    this.projectRepository = dependencies.projectRepository ?? new ProjectRepository();
    this.progressRepository = dependencies.progressRepository ?? new TutorialProgressRepository();
    this.getRedis = dependencies.getRedis ?? getRedisClient;
    this.getQStash = dependencies.getQStash ?? getQStashClient;
    this.log = dependencies.logger ?? logger;
    this.appUrl = dependencies.appUrl ?? getAppUrl();
    this.now = dependencies.now ?? (() => new Date());
  }

  private async getProjectProgressMissingRequirements(project: ProjectRecord, userId: string) {
    const missing = [];
    for (const subtopicId of project.subtopicsCovered) {
      const complete = await this.progressRepository.isSubtopicComplete(userId, subtopicId);
      if (!complete) {
        missing.push(`subtopic:${subtopicId}`);
      }
    }
    return missing;
  }

  async submitProject(
    userId: string,
    projectId: string,
    deliverable: ProjectDeliverable
  ): Promise<ProjectSubmissionResult> {
    const project = await this.projectRepository.getProject(projectId);
    if (project === undefined) {
      throw new ProjectNotEligibleError('project not found');
    }

    const missingRequirements = await this.getProjectProgressMissingRequirements(project, userId);
    if (missingRequirements.length > 0) {
      throw new ProjectNotEligibleError(missingRequirements.join(', '));
    }

    if (!hasRequiredDeliverable(project, deliverable)) {
      throw new ProjectNotEligibleError('required deliverable missing');
    }

    const redisKey = `project-submit:${userId}:${projectId}`;
    const redis = this.getRedis();

    const existingMarker = await redis.get(redisKey);
    if (existingMarker !== null && String(existingMarker).trim().length > 0) {
      const submissions = await this.projectRepository.getSubmissionsByUser(userId);
      const existingSubmission = submissions.find((submission) => submission.projectId === projectId);
      if (existingSubmission !== undefined) {
        return { submissionId: existingSubmission.id };
      }
    }

    const submission = await db.transaction(async (tx) => {
      const txRepo = this.projectRepository.withDb(tx as never);
      const created = await txRepo.createSubmission({
        userId,
        projectId,
        projectLevel: project.level,
        difficulty: project.level === 'simple' ? 'simple' : project.level === 'intermediate' ? 'intermediate' : 'expert',
        submissionContent: deliverable,
        status: 'submitted',
        videoRequired: false,
        videoUrl: null,
        submittedAt: this.now(),
        gradedAt: null,
        score: null,
        feedback: null,
        aiReview: null,
        peerReviews: [],
        adminReview: null,
        badgeAwarded: false,
      });

      await Promise.resolve(redis.set(redisKey, created.id, { ex: 86_400, nx: true }));
      return created;
    });

    await this.getQStash().publishJSON({
      url: buildWorkerUrl(this.appUrl, DEFAULT_REVIEW_WORKER_PATH),
      retries: 3,
      body: {
        id: crypto.randomUUID(),
        type: 'project.submitted',
        correlationId: submission.id,
        source: 'quiz-platform',
        occurredAt: this.now().toISOString(),
        version: 1,
        data: {
          submissionId: submission.id,
          userId,
          projectId,
        },
      },
    });

    this.log.info({
      event: 'project.submitted',
      userId,
      projectId,
      submissionId: submission.id,
    });

    return { submissionId: submission.id };
  }

  async getProject(projectId: string, userId: string): Promise<ProjectViewResult> {
    const project = await this.projectRepository.getProject(projectId);
    const submission = (await this.projectRepository.getSubmissionsByUser(userId)).find(
      (row) => row.projectId === projectId
    );

    return { project, submission };
  }

  async getMyProjects(userId: string): Promise<ProjectSubmissionRecord[]> {
    return this.projectRepository.getSubmissionsByUser(userId);
  }

  async checkCertificateEligibility(
    userId: string,
    scope: ProjectScope,
    parentId: string
  ): Promise<ProjectEligibilityResult> {
    const projects = await this.projectRepository.getProjectsByScope(scope, parentId);
    const requiredLevel = getRequiredLevel(scope);
    const project = projects.find((item) => item.level === requiredLevel);

    const missingRequirements: string[] = [];
    if (project === undefined) {
      missingRequirements.push(`missing:${requiredLevel}-project`);
      return { eligible: false, missingRequirements };
    }

    const missingContent = await this.getProjectProgressMissingRequirements(project, userId);
    missingRequirements.push(...missingContent);

    const submission = (await this.projectRepository.getSubmissionsByUser(userId)).find(
      (item) => item.projectId === project.id
    );

    if (submission === undefined || submission.status !== 'approved') {
      missingRequirements.push(`project:${project.id}:not-approved`);
    }

    return {
      eligible: missingRequirements.length === 0,
      missingRequirements,
    };
  }
}
