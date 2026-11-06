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
  private static readonly dbWriteLocks = new WeakMap<object, Map<string, Promise<unknown>>>();

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new TutorialProgressRepository(dbClient as typeof db) as this;
  }

  private async withDbKeyWriteLock<T>(
    key: string,
    fn: (waitedForPriorWriter: boolean) => Promise<T>
  ): Promise<T> {
    const dbRef =
      typeof this.dbInstance === 'object' && this.dbInstance !== null
        ? (this.dbInstance as object)
        : TutorialProgressRepository;
    let lockMap = TutorialProgressRepository.dbWriteLocks.get(dbRef);
    if (!lockMap) {
      lockMap = new Map<string, Promise<unknown>>();
      TutorialProgressRepository.dbWriteLocks.set(dbRef, lockMap);
    }

    const previous = lockMap.get(key);
    const waitedForPriorWriter = previous !== undefined;
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = (previous ?? Promise.resolve()).then(() => next, () => next);
    lockMap.set(key, chained);

    if (previous !== undefined) {
      await previous.catch(() => undefined);
    }
    try {
      return await fn(waitedForPriorWriter);
    } finally {
      release();
      if (lockMap.get(key) === chained) {
        lockMap.delete(key);
      }
    }
  }

  private requireTenantCondition(tenantId?: string) {
    if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      throw new Error('Verified tenant context (tenantId) is required for tutorial progress');
    }
    const trimmed = tenantId.trim().toLowerCase();
    if (!VALID_TUTORIAL_TENANTS.has(trimmed)) {
      throw new Error(`Invalid tenant context for tutorial progress: ${tenantId}`);
    }
    return {
      normalizedTenant: trimmed,
      condition: eq(tutorialProgress.tenantId, trimmed),
    };
  }

  async findById(id: string, tenantId?: string): Promise<TutorialProgressRecord | undefined> {
    const { normalizedTenant, condition } = this.requireTenantCondition(tenantId);

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProgress)
        .where(and(eq(tutorialProgress.id, id), condition, activeProgress)),
      'TutorialProgressRepository.findById'
    );

    const row = rows[0] as (TutorialProgressRecord & { tenantId?: string | null }) | undefined;
    if (row && row.tenantId && row.tenantId !== normalizedTenant) {
      return undefined;
    }
    return row;
  }

  async getProgress(userId: string, subtopicId: string, tenantId?: string): Promise<TutorialProgressRecord | undefined> {
    const { normalizedTenant, condition } = this.requireTenantCondition(tenantId);

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProgress)
        .where(
          and(
            eq(tutorialProgress.userId, userId),
            eq(tutorialProgress.subtopicId, subtopicId),
            condition,
            activeProgress
          )
        ),
      'TutorialProgressRepository.getProgress'
    );

    const row = rows[0] as (TutorialProgressRecord & { tenantId?: string | null }) | undefined;
    if (row && row.tenantId && row.tenantId !== normalizedTenant) {
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
    const { normalizedTenant, condition } = this.requireTenantCondition(tenantId);
    const lockKey = `${normalizedTenant}:${userId}:${subtopicId}`;

    // Perform initial read before write lock so concurrent repository instances can both read
    const initialExisting = await this.getProgress(userId, subtopicId, normalizedTenant);

    return this.withDbKeyWriteLock(lockKey, async (waitedForPriorWriter) => {
      const existing = waitedForPriorWriter
        ? ((await this.getProgress(userId, subtopicId, normalizedTenant)) ?? initialExisting)
        : initialExisting;
      const now = new Date();

      if (!existing) {
        const snapshot = calculateTutorialProgress({ completedSections: [blockType] });
        const [created] = await this.runRead(
          this.dbInstance
            .insert(tutorialProgress)
            .values({
              userId,
              subtopicId,
              tenantId: normalizedTenant,
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
      const expectedVersion = typeof existing.version === 'number' ? existing.version : 1;
      const nextVersion = expectedVersion + 1;

      const [updated] = await this.runRead(
        this.dbInstance
          .update(tutorialProgress)
          .set({
            blocksCompleted: mergedBlocks,
            status: snapshot.status,
            completedAt: snapshot.status === 'completed' ? existing.completedAt ?? now : existing.completedAt,
            remediationTriggered: snapshot.remediationTriggered,
            version: nextVersion,
            updatedAt: now,
            deletedAt: null,
          })
          .where(
            and(
              eq(tutorialProgress.id, existing.id),
              condition,
              activeProgress,
              eq(tutorialProgress.version, expectedVersion)
            )
          )
          .returning(),
        'TutorialProgressRepository.markBlockComplete.update'
      );

      if (!updated) {
        const latest = await this.getProgress(userId, subtopicId, normalizedTenant);
        if (!latest) {
          throw new Error('Concurrent tutorial progress modification detected and row no longer exists');
        }
        const retryMergedBlocks = mergeCompletedTutorialSection(latest.blocksCompleted ?? [], blockType);
        const retrySnapshot = calculateTutorialProgress({
          completedSections: retryMergedBlocks,
          assignmentCompleted: retryMergedBlocks.includes('assignment'),
          projectCompleted: retryMergedBlocks.includes('project'),
        });
        const retryExpectedVersion = typeof latest.version === 'number' ? latest.version : 1;
        const [retried] = await this.runRead(
          this.dbInstance
            .update(tutorialProgress)
            .set({
              blocksCompleted: retryMergedBlocks,
              status: retrySnapshot.status,
              completedAt: retrySnapshot.status === 'completed' ? latest.completedAt ?? now : latest.completedAt,
              remediationTriggered: retrySnapshot.remediationTriggered,
              version: retryExpectedVersion + 1,
              updatedAt: now,
              deletedAt: null,
            })
            .where(
              and(
                eq(tutorialProgress.id, latest.id),
                condition,
                activeProgress,
                eq(tutorialProgress.version, retryExpectedVersion)
              )
            )
            .returning(),
          'TutorialProgressRepository.markBlockComplete.retryUpdate'
        );
        return (retried ?? latest) as TutorialProgressRecord;
      }

      return updated as TutorialProgressRecord;
    });
  }

  async isSubtopicComplete(userId: string, subtopicId: string, tenantId?: string): Promise<boolean> {
    const { normalizedTenant } = this.requireTenantCondition(tenantId);
    const progress = await this.getProgress(userId, subtopicId, normalizedTenant);
    if (!progress) {
      return false;
    }

    return calculateTutorialProgress({ completedSections: progress.blocksCompleted }).status === 'completed';
  }

  async getCompletedSubtopics(userId: string, tenantId?: string): Promise<string[]> {
    const { condition } = this.requireTenantCondition(tenantId);

    const rows = await this.runReport(
      this.dbInstance
        .select({ subtopicId: tutorialProgress.subtopicId })
        .from(tutorialProgress)
        .where(
          and(
            eq(tutorialProgress.userId, userId),
            eq(tutorialProgress.status, 'completed'),
            condition,
            activeProgress
          )
        ),
      'TutorialProgressRepository.getCompletedSubtopics'
    );

    return rows.map((row) => row.subtopicId);
  }

  async resetProgress(userId: string, subtopicId: string, tenantId?: string): Promise<TutorialProgressRecord> {
    const { normalizedTenant, condition } = this.requireTenantCondition(tenantId);
    const existing = await this.getProgress(userId, subtopicId, normalizedTenant);
    const now = new Date();

    if (!existing) {
      const [created] = await this.runRead(
        this.dbInstance
          .insert(tutorialProgress)
          .values({
            userId,
            subtopicId,
            tenantId: normalizedTenant,
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

    const expectedVersion = typeof existing.version === 'number' ? existing.version : 1;
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
          version: expectedVersion + 1,
          updatedAt: now,
          deletedAt: null,
        })
        .where(and(eq(tutorialProgress.id, existing.id), condition, activeProgress))
        .returning(),
      'TutorialProgressRepository.resetProgress.update'
    );

    return updated as TutorialProgressRecord;
  }
}
