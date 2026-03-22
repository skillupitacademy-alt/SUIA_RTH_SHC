import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../db';
import { badges } from '../schema/badges';
import { studentBadges } from '../schema/student-badges';
import { tutorialProjects } from '../schema/tutorial-projects';
import { tutorialProjectSubmissions } from '../schema/tutorial-project-submissions';

import type {
  IProjectRepository,
  ProjectBadgeAwardRecord,
  ProjectRecord,
  ProjectScope,
  ProjectSubmissionCreateInput,
  ProjectSubmissionRecord,
  ProjectSubmissionStatus,
  TutorialDbClientLike,
} from '@quiz/types';

import { ProjectTransitionError } from '@quiz/types';

import { TutorialRepositoryBase } from './base.repository';

const activeProject = isNull(tutorialProjects.deletedAt);
const activeSubmission = isNull(tutorialProjectSubmissions.deletedAt);
const activeBadge = isNull(badges.deletedAt);
const activeStudentBadge = isNull(studentBadges.deletedAt);

const allowedTransitions: Record<ProjectSubmissionStatus, ProjectSubmissionStatus[]> = {
  pending: ['submitted', 'graded', 'revision-requested'],
  submitted: ['ai_reviewing'],
  ai_reviewing: ['needs_review'],
  needs_review: ['approved', 'revision_needed'],
  approved: [],
  revision_needed: ['submitted'],
  graded: [],
  'revision-requested': ['submitted'],
};

export class ProjectRepository extends TutorialRepositoryBase implements IProjectRepository {
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new ProjectRepository(dbClient as typeof db) as this;
  }

  async getProject(projectId: string): Promise<ProjectRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance.select().from(tutorialProjects).where(and(eq(tutorialProjects.id, projectId), activeProject)),
      'ProjectRepository.getProject'
    );

    return rows[0] as ProjectRecord | undefined;
  }

  async getSubmission(submissionId: string): Promise<ProjectSubmissionRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProjectSubmissions)
        .where(and(eq(tutorialProjectSubmissions.id, submissionId), activeSubmission)),
      'ProjectRepository.getSubmission'
    );

    return rows[0] as ProjectSubmissionRecord | undefined;
  }

  async getSubmissionsByUser(userId: string): Promise<ProjectSubmissionRecord[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProjectSubmissions)
        .where(and(eq(tutorialProjectSubmissions.userId, userId), activeSubmission)),
      'ProjectRepository.getSubmissionsByUser'
    );

    return rows as ProjectSubmissionRecord[];
  }

  async createSubmission(data: ProjectSubmissionCreateInput): Promise<ProjectSubmissionRecord> {
    const now = new Date();
    const [row] = await this.runRead(
      this.dbInstance
        .insert(tutorialProjectSubmissions)
        .values({
          userId: data.userId,
          projectId: data.projectId,
          projectLevel: data.projectLevel,
          difficulty: data.difficulty,
          submissionContent: data.submissionContent,
          status: data.status ?? 'submitted',
          score: data.score ?? null,
          feedback: data.feedback ?? null,
          aiReview: data.aiReview ?? null,
          peerReviews: data.peerReviews ?? [],
          adminReview: data.adminReview ?? null,
          badgeAwarded: data.badgeAwarded ?? false,
          videoRequired: data.videoRequired ?? false,
          videoUrl: data.videoUrl ?? null,
          submittedAt: data.submittedAt ?? now,
          gradedAt: data.gradedAt ?? null,
          version: 1,
          deletedAt: null,
        } as any)
        .returning(),
      'ProjectRepository.createSubmission'
    );

    return row as ProjectSubmissionRecord;
  }

  async updateSubmissionStatus(
    submissionId: string,
    status: ProjectSubmissionStatus,
    reviewData?: Record<string, unknown> | null
  ): Promise<ProjectSubmissionRecord | undefined> {
    const current = await this.getSubmission(submissionId);
    if (current === undefined) {
      return undefined;
    }

    const allowed = allowedTransitions[current.status] ?? [];
    if (current.status !== status && allowed.includes(status) === false) {
      throw new ProjectTransitionError(current.status, status);
    }

    const now = new Date();
    const updatePayload: Record<string, unknown> = {
      status,
      version: sql`${tutorialProjectSubmissions.version} + 1`,
      updatedAt: now,
      deletedAt: null,
    };

    if (status === 'submitted') {
      updatePayload.submittedAt = now;
    }

    if (status === 'ai_reviewing' && reviewData !== undefined) {
      updatePayload.aiReview = reviewData;
    }

    if (status === 'needs_review' && reviewData !== undefined) {
      updatePayload.aiReview = reviewData;
    }

    if ((status === 'approved' || status === 'revision_needed') && reviewData !== undefined) {
      updatePayload.adminReview = reviewData;
      updatePayload.gradedAt = now;
    }

    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialProjectSubmissions)
        .set(updatePayload)
        .where(and(eq(tutorialProjectSubmissions.id, submissionId), activeSubmission))
        .returning(),
      'ProjectRepository.updateSubmissionStatus'
    );

    return rows[0] as ProjectSubmissionRecord | undefined;
  }

  async awardBadge(userId: string, badgeId: string, submissionId: string): Promise<ProjectBadgeAwardRecord> {
    const [existingBadge] = await this.runRead(
      this.dbInstance
        .select()
        .from(badges)
        .where(and(eq(badges.id, badgeId), activeBadge)),
      'ProjectRepository.awardBadge.badgeLookup'
    );

    if (existingBadge === undefined) {
      throw new Error('Badge not found');
    }

    const [row] = await this.runRead(
      this.dbInstance
        .insert(studentBadges)
        .values({
          userId,
          badgeId,
          awardedAt: new Date(),
          projectSubmissionId: submissionId,
          deletedAt: null,
        })
        .onConflictDoNothing()
        .returning(),
      'ProjectRepository.awardBadge'
    );

    if (row !== undefined) {
      return row as ProjectBadgeAwardRecord;
    }

    const [existingAward] = await this.runRead(
      this.dbInstance
        .select()
        .from(studentBadges)
        .where(and(eq(studentBadges.userId, userId), eq(studentBadges.badgeId, badgeId), activeStudentBadge)),
      'ProjectRepository.awardBadge.existing'
    );

    return existingAward as ProjectBadgeAwardRecord;
  }

  async getBadgesByUser(userId: string): Promise<ProjectBadgeAwardRecord[]> {
    const rows = await this.runReport(
      this.dbInstance
        .select()
        .from(studentBadges)
        .where(and(eq(studentBadges.userId, userId), activeStudentBadge)),
      'ProjectRepository.getBadgesByUser'
    );

    return rows as ProjectBadgeAwardRecord[];
  }

  async getProjectsByScope(scope: ProjectScope, parentId: string): Promise<ProjectRecord[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProjects)
        .where(and(eq(tutorialProjects.scope, scope), eq(tutorialProjects.parentId, parentId), activeProject)),
      'ProjectRepository.getProjectsByScope'
    );

    return rows as ProjectRecord[];
  }
}
