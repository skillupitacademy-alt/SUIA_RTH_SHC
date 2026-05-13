import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../db';
import { tutorialProgress } from '../schema/tutorial-progress';

import type {
  ContentBlockType,
  ITutorialProgressRepository,
  TutorialDbClientLike,
  TutorialProgressRecord,
} from '@quiz/types';
import { calculateTutorialProgress, mergeCompletedTutorialSection } from '@quiz/validation';

import { TutorialRepositoryBase } from './base.repository';

const activeProgress = isNull(tutorialProgress.deletedAt);

export class TutorialProgressRepository
  extends TutorialRepositoryBase
  implements ITutorialProgressRepository
{
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new TutorialProgressRepository(dbClient as typeof db) as this;
  }

  async findById(id: string): Promise<TutorialProgressRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProgress)
        .where(and(eq(tutorialProgress.id, id), activeProgress)),
      'TutorialProgressRepository.findById'
    );

    return rows[0] as TutorialProgressRecord | undefined;
  }

  async getProgress(userId: string, subtopicId: string): Promise<TutorialProgressRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProgress)
        .where(
          and(
            eq(tutorialProgress.userId, userId),
            eq(tutorialProgress.subtopicId, subtopicId),
            activeProgress
          )
        ),
      'TutorialProgressRepository.getProgress'
    );

    return rows[0] as TutorialProgressRecord | undefined;
  }

  async markBlockComplete(
    userId: string,
    subtopicId: string,
    blockType: ContentBlockType
  ): Promise<TutorialProgressRecord> {
    const existing = await this.getProgress(userId, subtopicId);
    const now = new Date();

    if (!existing) {
      const snapshot = calculateTutorialProgress({ completedSections: [blockType] });
      const [created] = await this.runRead(
        this.dbInstance
          .insert(tutorialProgress)
          .values({
            userId,
            subtopicId,
            status: snapshot.status,
            blocksCompleted: snapshot.completedSections,
            remediationTriggered: snapshot.remediationTriggered,
            score: null,
            timeSpentSec: 0,
            completedAt: snapshot.status === 'completed' ? now : null,
            version: 1,
            deletedAt: null,
          })
          .returning(),
        'TutorialProgressRepository.markBlockComplete.insert'
      );

      return created as TutorialProgressRecord;
    }

    const mergedBlocks = mergeCompletedTutorialSection(existing.blocksCompleted ?? [], blockType);
    const snapshot = calculateTutorialProgress({
      completedSections: mergedBlocks,
      assignmentCompleted: mergedBlocks.includes('assignment'),
      projectCompleted: mergedBlocks.includes('project'),
    });

    const [updated] = await this.runRead(
      this.dbInstance
        .update(tutorialProgress)
        .set({
          blocksCompleted: mergedBlocks,
          status: snapshot.status,
          completedAt: snapshot.status === 'completed' ? existing.completedAt ?? now : existing.completedAt,
          remediationTriggered: snapshot.remediationTriggered,
          version: sql`${tutorialProgress.version} + 1`,
          updatedAt: now,
          deletedAt: null,
        })
        .where(eq(tutorialProgress.id, existing.id))
        .returning(),
      'TutorialProgressRepository.markBlockComplete.update'
    );

    return updated as TutorialProgressRecord;
  }

  async isSubtopicComplete(userId: string, subtopicId: string): Promise<boolean> {
    const progress = await this.getProgress(userId, subtopicId);
    if (!progress) {
      return false;
    }

    return calculateTutorialProgress({ completedSections: progress.blocksCompleted }).status === 'completed';
  }

  async getCompletedSubtopics(userId: string): Promise<string[]> {
    const rows = await this.runReport(
      this.dbInstance
        .select({ subtopicId: tutorialProgress.subtopicId })
        .from(tutorialProgress)
        .where(
          and(
            eq(tutorialProgress.userId, userId),
            eq(tutorialProgress.status, 'completed'),
            activeProgress
          )
        ),
      'TutorialProgressRepository.getCompletedSubtopics'
    );

    return rows.map((row) => row.subtopicId);
  }

  async resetProgress(userId: string, subtopicId: string): Promise<TutorialProgressRecord> {
    const existing = await this.getProgress(userId, subtopicId);
    const now = new Date();

    if (!existing) {
      const [created] = await this.runRead(
        this.dbInstance
          .insert(tutorialProgress)
          .values({
            userId,
            subtopicId,
            status: 'not_started',
            blocksCompleted: [],
            remediationTriggered: false,
            score: null,
            timeSpentSec: 0,
            completedAt: null,
            version: 1,
            deletedAt: null,
          })
          .returning(),
        'TutorialProgressRepository.resetProgress.insert'
      );

      return created as TutorialProgressRecord;
    }

    const [updated] = await this.runRead(
      this.dbInstance
        .update(tutorialProgress)
        .set({
          status: 'not_started',
          blocksCompleted: [],
          remediationTriggered: false,
          score: null,
          timeSpentSec: 0,
          completedAt: null,
          version: sql`${tutorialProgress.version} + 1`,
          updatedAt: now,
          deletedAt: null,
        })
        .where(eq(tutorialProgress.id, existing.id))
        .returning(),
      'TutorialProgressRepository.resetProgress.update'
    );

    return updated as TutorialProgressRecord;
  }
}
