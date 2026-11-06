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
const VALID_TUTORIAL_TENANTS = new Set(['realtutorialhub', 'skillup', 'skillhubcore']);

export class TutorialProgressRepository
  extends TutorialRepositoryBase
  implements ITutorialProgressRepository
{
  private readonly progressLocks = new Map<string, Promise<unknown>>();

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new TutorialProgressRepository(dbClient as typeof db) as this;
  }

  private async withProgressKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.progressLocks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = previous.then(() => next, () => next);
    this.progressLocks.set(key, chained);

    await previous.catch(() => undefined);
    try {
      return await fn();
    } finally {
      release();
      if (this.progressLocks.get(key) === chained) {
        this.progressLocks.delete(key);
      }
    }
  }

  private normalizeTenantCondition(tenantId?: string) {
    if (tenantId === undefined) return undefined;
    const trimmed = tenantId.trim().toLowerCase();
    if (!VALID_TUTORIAL_TENANTS.has(trimmed)) {
      return null;
    }
    return eq(tutorialProgress.tenantId, trimmed);
  }

  async findById(id: string, tenantId?: string): Promise<TutorialProgressRecord | undefined> {
    const tenantCondition = this.normalizeTenantCondition(tenantId);
    if (tenantCondition === null) return undefined;

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProgress)
        .where(
          tenantCondition
            ? and(eq(tutorialProgress.id, id), tenantCondition, activeProgress)
            : and(eq(tutorialProgress.id, id), activeProgress)
        ),
      'TutorialProgressRepository.findById'
    );

    const row = rows[0] as (TutorialProgressRecord & { tenantId?: string | null }) | undefined;
    if (row && tenantId !== undefined && row.tenantId && row.tenantId !== tenantId.trim().toLowerCase()) {
      return undefined;
    }
    return row;
  }

  async getProgress(userId: string, subtopicId: string, tenantId?: string): Promise<TutorialProgressRecord | undefined> {
    const tenantCondition = this.normalizeTenantCondition(tenantId);
    if (tenantCondition === null) return undefined;

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProgress)
        .where(
          tenantCondition
            ? and(
                eq(tutorialProgress.userId, userId),
                eq(tutorialProgress.subtopicId, subtopicId),
                tenantCondition,
                activeProgress
              )
            : and(
                eq(tutorialProgress.userId, userId),
                eq(tutorialProgress.subtopicId, subtopicId),
                activeProgress
              )
        ),
      'TutorialProgressRepository.getProgress'
    );

    const row = rows[0] as (TutorialProgressRecord & { tenantId?: string | null }) | undefined;
    if (row && tenantId !== undefined && row.tenantId && row.tenantId !== tenantId.trim().toLowerCase()) {
      return undefined;
    }
    return row;
  }

  async markBlockComplete(
    userId: string,
    subtopicId: string,
    blockType: ContentBlockType,
    tenantId?: string
  ): Promise<TutorialProgressRecord> {
    if (tenantId !== undefined && this.normalizeTenantCondition(tenantId) === null) {
      throw new Error('Invalid tenant context for tutorial progress');
    }
    const normalizedTenant = tenantId?.trim().toLowerCase();
    const lockKey = `${normalizedTenant ?? 'default'}:${userId}:${subtopicId}`;

    return this.withProgressKeyLock(lockKey, async () => {
      const existing = await this.getProgress(userId, subtopicId, tenantId);
      const now = new Date();

      if (!existing) {
        const snapshot = calculateTutorialProgress({ completedSections: [blockType] });
        const [created] = await this.runRead(
          this.dbInstance
            .insert(tutorialProgress)
            .values({
              userId,
              subtopicId,
              ...(normalizedTenant ? { tenantId: normalizedTenant } : {}),
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
    });
  }

  async isSubtopicComplete(userId: string, subtopicId: string, tenantId?: string): Promise<boolean> {
    const progress = await this.getProgress(userId, subtopicId, tenantId);
    if (!progress) {
      return false;
    }

    return calculateTutorialProgress({ completedSections: progress.blocksCompleted }).status === 'completed';
  }

  async getCompletedSubtopics(userId: string, tenantId?: string): Promise<string[]> {
    const tenantCondition = this.normalizeTenantCondition(tenantId);
    if (tenantCondition === null) return [];

    const rows = await this.runReport(
      this.dbInstance
        .select({ subtopicId: tutorialProgress.subtopicId })
        .from(tutorialProgress)
        .where(
          tenantCondition
            ? and(
                eq(tutorialProgress.userId, userId),
                eq(tutorialProgress.status, 'completed'),
                tenantCondition,
                activeProgress
              )
            : and(
                eq(tutorialProgress.userId, userId),
                eq(tutorialProgress.status, 'completed'),
                activeProgress
              )
        ),
      'TutorialProgressRepository.getCompletedSubtopics'
    );

    return rows.map((row) => row.subtopicId);
  }

  async resetProgress(userId: string, subtopicId: string, tenantId?: string): Promise<TutorialProgressRecord> {
    if (tenantId !== undefined && this.normalizeTenantCondition(tenantId) === null) {
      throw new Error('Invalid tenant context for tutorial progress');
    }
    const normalizedTenant = tenantId?.trim().toLowerCase();
    const existing = await this.getProgress(userId, subtopicId, tenantId);
    const now = new Date();

    if (!existing) {
      const [created] = await this.runRead(
        this.dbInstance
          .insert(tutorialProgress)
          .values({
            userId,
            subtopicId,
            ...(normalizedTenant ? { tenantId: normalizedTenant } : {}),
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
