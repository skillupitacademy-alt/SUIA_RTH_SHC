import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../db';
import { tutorialProjectSubmissions } from '../schema/tutorial-project-submissions';
import { tutorialProjects } from '../schema/tutorial-projects';

import type {
  IProjectSubmissionRepository,
  TutorialDbClientLike,
  TutorialDifficulty,
  TutorialProjectLevel,
  TutorialProjectSubmissionCreateInput,
  TutorialProjectSubmissionRecord,
} from '@quiz/types';

import { TutorialRepositoryBase } from './base.repository';

const activeSubmission = isNull(tutorialProjectSubmissions.deletedAt);

export class ProjectSubmissionRepository
  extends TutorialRepositoryBase
  implements IProjectSubmissionRepository
{
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new ProjectSubmissionRepository(dbClient as typeof db) as this;
  }

  async findById(id: string): Promise<TutorialProjectSubmissionRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProjectSubmissions)
        .where(and(eq(tutorialProjectSubmissions.id, id), activeSubmission)),
      'ProjectSubmissionRepository.findById'
    );

    return rows[0] as TutorialProjectSubmissionRecord | undefined;
  }

  async submit(
    data: TutorialProjectSubmissionCreateInput
  ): Promise<TutorialProjectSubmissionRecord> {
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
          status: data.status ?? 'pending',
          score: data.score ?? null,
          feedback: data.feedback ?? null,
          videoRequired: data.videoRequired ?? false,
          videoUrl: data.videoUrl ?? null,
          submittedAt: data.submittedAt ?? now,
          gradedAt: data.gradedAt ?? null,
          version: 1,
          deletedAt: null,
        })
        .returning(),
      'ProjectSubmissionRepository.submit'
    );

    return row as TutorialProjectSubmissionRecord;
  }

  async grade(
    submissionId: string,
    score: number,
    feedback: string
  ): Promise<TutorialProjectSubmissionRecord | undefined> {
    const now = new Date();
    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialProjectSubmissions)
        .set({
          score,
          feedback,
          status: 'graded',
          gradedAt: now,
          version: sql`${tutorialProjectSubmissions.version} + 1`,
          updatedAt: now,
          deletedAt: null,
        })
        .where(and(eq(tutorialProjectSubmissions.id, submissionId), activeSubmission))
        .returning(),
      'ProjectSubmissionRepository.grade'
    );

    return rows[0] as TutorialProjectSubmissionRecord | undefined;
  }

  async getPending(projectId?: string): Promise<TutorialProjectSubmissionRecord[]> {
    const conditions = [
      eq(tutorialProjectSubmissions.status, 'pending'),
      activeSubmission,
    ];
    if (projectId) {
      conditions.push(eq(tutorialProjectSubmissions.projectId, projectId));
    }

    const rows = await this.runReport(
      this.dbInstance
        .select()
        .from(tutorialProjectSubmissions)
        .where(and(...conditions)),
      'ProjectSubmissionRepository.getPending'
    );

    return rows as TutorialProjectSubmissionRecord[];
  }

  async getByUser(
    userId: string,
    level?: TutorialProjectLevel
  ): Promise<TutorialProjectSubmissionRecord[]> {
    const conditions = [eq(tutorialProjectSubmissions.userId, userId), activeSubmission];
    if (level) {
      conditions.push(eq(tutorialProjectSubmissions.projectLevel, level));
    }

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProjectSubmissions)
        .where(and(...conditions)),
      'ProjectSubmissionRepository.getByUser'
    );

    return rows as TutorialProjectSubmissionRecord[];
  }

  async requiresVideo(projectId: string, difficulty: TutorialDifficulty): Promise<boolean> {
    const rows = await this.runRead(
      this.dbInstance
        .select({ level: tutorialProjects.level })
        .from(tutorialProjects)
        .where(eq(tutorialProjects.id, projectId)),
      'ProjectSubmissionRepository.requiresVideo'
    );

    if (rows.length === 0) {
      return difficulty !== 'simple';
    }

    const projectLevel = rows[0].level as TutorialProjectLevel;
    return difficulty !== 'simple' || projectLevel !== 'simple';
  }

  async softDelete(id: string): Promise<TutorialProjectSubmissionRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialProjectSubmissions)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(tutorialProjectSubmissions.id, id), activeSubmission))
        .returning(),
      'ProjectSubmissionRepository.softDelete'
    );

    return rows[0] as TutorialProjectSubmissionRecord | undefined;
  }
}
