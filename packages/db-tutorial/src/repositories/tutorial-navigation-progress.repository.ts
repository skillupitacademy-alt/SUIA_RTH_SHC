import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../db';
import { tutorialNavigationProgress } from '../schema/tutorial-navigation-progress';
import {
  buildAtomicBlockAppend,
  buildAtomicVisitCountIncrement,
  buildAtomicRevisionCountIncrement,
  buildAtomicFirstViewedAtInit,
  buildAtomicTimeIncrement,
  buildAtomicVersionIncrement,
} from './tutorial-navigation-progress-sql.helpers';

import type {
  CompletedBlockRecord,
  ITutorialNavigationProgressRepository,
  TutorialDbClientLike,
  TutorialNavigationProgressRecord,
  TutorialNavigationProgressCreateInput,
  TutorialBlockCompletionEvent,
  TutorialTimeUpdateEvent,
  TutorialVisitEvent,
} from '@quiz/types';

import { TutorialRepositoryBase } from './base.repository';

const activeProgress = isNull(tutorialNavigationProgress.deletedAt);

/**
 * Phase 2.6: Tutorial Navigation Progress Repository
 * 
 * Manages per-navigation-node learner progress tracking.
 * 
 * IDENTITY:
 * - Primary key: (userId, navigationNodeId) WHERE deleted_at IS NULL
 * - Partial unique index allows soft-deleted records
 * - One active row per learner per navigation node
 * 
 * CONCURRENCY:
 * - Uses INSERT ... ON CONFLICT with WHERE clause for partial unique index
 * - Block completion uses atomic JSONB append with EXISTS deduplication
 * - Visit recording uses atomic SQL CASE for session transition decision
 * - Time accumulation uses atomic SQL increment
 * - All UPDATE operations include soft-delete safety (deleted_at IS NULL)
 * - All operations are idempotent under concurrent execution
 * 
 * COMPLETION TRACKING:
 * - Stores completed_blocks as array of {blockId, blockVersion, completedAt}
 * - Preserves block version for content revision tracking
 * - Atomic JSONB append with EXISTS deduplication prevents lost updates AND duplicates
 * - Enables queries like "did learner complete D1 version of block ABC?"
 * 
 * SESSION/VISIT SEMANTICS (Repository responsibility):
 * - Persists lastSessionId (JWT family ID or client session UUID)
 * - lastSessionId is VISIT-OWNED: only recordVisit() may modify it
 * - recordTime() and markBlockCompleted() must NOT modify lastSessionId
 * - recordVisit() uses atomic SQL CASE to determine session transition
 * - Database decides if request wins session transition (prevents concurrent duplicate increments)
 * - IS DISTINCT FROM comparison handles null sessions correctly
 * - Revision = visit to completed node when lastSessionId changes
 * 
 * RESPONSIBILITY BOUNDARY:
 * 
 * REPOSITORY (this layer):
 * - Persistence of visit/session state
 * - Atomic updates and concurrency safety
 * - Idempotency guarantees
 * - Atomic session transition decision (SQL CASE inside UPDATE)
 * - Automatic revision detection (completed + session change)
 * - Soft-delete safety on all update operations
 * 
 * SERVICE LAYER (Phase 2.6-A3):
 * - Educational completion rules (D1/C1/S1 requirements)
 * - Eligibility validation ("can learner mark node complete?")
 * - Business logic orchestration
 * - Session ID generation/management (JWT family, client UUID)
 * - Calling repository with correct parameters
 * 
 * COMPLETION POLICY:
 * - Repository does NOT validate educational completion rules
 * - Service layer determines: "Can this node be marked complete?"
 * - Repository only persists: status='completed' when instructed
 */
export class TutorialNavigationProgressRepository
  extends TutorialRepositoryBase
  implements ITutorialNavigationProgressRepository
{
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new TutorialNavigationProgressRepository(dbClient as typeof db) as this;
  }

  async findById(id: string): Promise<TutorialNavigationProgressRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialNavigationProgress)
        .where(and(eq(tutorialNavigationProgress.id, id), activeProgress)),
      'TutorialNavigationProgressRepository.findById'
    );

    return rows[0] as TutorialNavigationProgressRecord | undefined;
  }

  async getProgress(
    userId: string,
    navigationNodeId: string
  ): Promise<TutorialNavigationProgressRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialNavigationProgress)
        .where(
          and(
            eq(tutorialNavigationProgress.userId, userId),
            eq(tutorialNavigationProgress.navigationNodeId, navigationNodeId),
            activeProgress
          )
        ),
      'TutorialNavigationProgressRepository.getProgress'
    );

    return rows[0] as TutorialNavigationProgressRecord | undefined;
  }

  async getProgressForSubtopic(
    userId: string,
    subtopicId: string
  ): Promise<TutorialNavigationProgressRecord[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialNavigationProgress)
        .where(
          and(
            eq(tutorialNavigationProgress.userId, userId),
            eq(tutorialNavigationProgress.subtopicId, subtopicId),
            activeProgress
          )
        ),
      'TutorialNavigationProgressRepository.getProgressForSubtopic'
    );

    return rows as TutorialNavigationProgressRecord[];
  }

  /**
   * Create or get existing progress record (concurrency-safe)
   * 
   * Creates MINIMAL progress record without manufacturing a visit.
   * Visit semantics are established by explicit recordVisit() calls.
   * 
   * Uses INSERT ... ON CONFLICT to handle race conditions.
   * Includes targetWhere for partial unique index (deleted_at IS NULL).
   * If record already exists, returns existing record.
   */
  async createProgress(
    data: TutorialNavigationProgressCreateInput
  ): Promise<TutorialNavigationProgressRecord> {
    const now = new Date();

    try {
      // Attempt INSERT with ON CONFLICT DO NOTHING
      // Must include WHERE clause for partial unique index
      const [created] = await this.runRead(
        this.dbInstance
          .insert(tutorialNavigationProgress)
          .values({
            userId: data.userId,
            navigationNodeId: data.navigationNodeId,
            sectionId: data.sectionId ?? null,
            subtopicId: data.subtopicId,
            status: 'not_started',
            completedBlocks: [],
            timeSpentActiveSec: 0,
            visitCount: 0, // Explicit visit required
            revisionCount: 0,
            lastSessionId: null, // Established by first visit
            firstViewedAt: null, // Established by first visit
            lastViewedAt: null, // Established by first visit
            completedAt: null,
            version: 1,
            deletedAt: null,
          })
          .onConflictDoNothing({
            target: [
              tutorialNavigationProgress.userId,
              tutorialNavigationProgress.navigationNodeId,
            ],
            where: sql`${tutorialNavigationProgress.deletedAt} IS NULL`,
          })
          .returning(),
        'TutorialNavigationProgressRepository.createProgress'
      );

      if (created) {
        return created as TutorialNavigationProgressRecord;
      }

      // Conflict occurred - fetch existing record
      const existing = await this.getProgress(data.userId, data.navigationNodeId);
      if (!existing) {
        throw new Error('Failed to create or fetch progress record');
      }

      return existing;
    } catch (error) {
      // Fallback: fetch existing if insert failed
      const existing = await this.getProgress(data.userId, data.navigationNodeId);
      if (existing) {
        return existing;
      }

      throw error;
    }
  }

  /**
   * Mark block as completed (idempotent, concurrency-safe)
   * 
   * Preserves blockId + blockVersion + completedAt timestamp.
   * Uses atomic JSONB operations to prevent lost updates in concurrent scenarios.
   * If block already completed with same version, no-op.
   * If block completed with different version, adds new completion record.
   */
  async markBlockCompleted(
    event: TutorialBlockCompletionEvent
  ): Promise<TutorialNavigationProgressRecord> {
    const existing = await this.getProgress(event.userId, event.navigationNodeId);
    const now = event.occurredAt ?? new Date();

    // Create record if doesn't exist
    if (!existing) {
      const newRecord: CompletedBlockRecord = {
        blockId: event.blockId,
        blockVersion: event.blockVersion,
        completedAt: now.toISOString(),
      };

      const [created] = await this.runRead(
        this.dbInstance
          .insert(tutorialNavigationProgress)
          .values({
            userId: event.userId,
            navigationNodeId: event.navigationNodeId,
            sectionId: event.sectionId,
            subtopicId: event.subtopicId,
            status: 'in_progress',
            completedBlocks: [newRecord],
            timeSpentActiveSec: 0,
            visitCount: 1,
            revisionCount: 0,
            lastSessionId: null, // Do not set session from block completion
            firstViewedAt: now,
            lastViewedAt: now,
            completedAt: null,
            version: 1,
            deletedAt: null,
          })
          .onConflictDoNothing({
            target: [
              tutorialNavigationProgress.userId,
              tutorialNavigationProgress.navigationNodeId,
            ],
            where: sql`${tutorialNavigationProgress.deletedAt} IS NULL`,
          })
          .returning(),
        'TutorialNavigationProgressRepository.markBlockCompleted.create'
      );

      if (created) {
        return created as TutorialNavigationProgressRecord;
      }

      // Conflict - retry with existing record
      const retry = await this.getProgress(event.userId, event.navigationNodeId);
      if (retry) {
        return this.markBlockCompleted(event); // Recursive retry
      }

      throw new Error('Failed to create progress for block completion');
    }

    // Check if block+version already completed (idempotency)
    const completedBlocks = existing.completedBlocks ?? [];
    const alreadyCompleted = completedBlocks.some(
      (record) => record.blockId === event.blockId && record.blockVersion === event.blockVersion
    );

    if (alreadyCompleted) {
      // Block already completed with this version - update lastViewedAt only
      const [updated] = await this.runRead(
        this.dbInstance
          .update(tutorialNavigationProgress)
          .set({
            lastViewedAt: now,
            version: buildAtomicVersionIncrement(tutorialNavigationProgress.version),
            updatedAt: now,
          })
          .where(
            and(
              eq(tutorialNavigationProgress.id, existing.id),
              activeProgress // Soft-delete safety
            )
          )
          .returning(),
        'TutorialNavigationProgressRepository.markBlockCompleted.idempotent'
      );

      return updated as TutorialNavigationProgressRecord;
    }

    // Add new completion record atomically with deduplication
    // Uses JSONB operations to prevent both lost updates AND duplicate entries
    const newRecord: CompletedBlockRecord = {
      blockId: event.blockId,
      blockVersion: event.blockVersion,
      completedAt: now.toISOString(),
    };

    const newStatus = existing.status === 'not_started' ? 'in_progress' : existing.status;

    // Atomic append with deduplication check inside UPDATE
    // Only appends if (blockId, blockVersion) doesn't already exist
    const [updated] = await this.runRead(
      this.dbInstance
        .update(tutorialNavigationProgress)
        .set({
          completedBlocks: buildAtomicBlockAppend(
            tutorialNavigationProgress.completedBlocks,
            event.blockId,
            event.blockVersion,
            newRecord
          ),
          status: newStatus,
          lastViewedAt: now,
          version: buildAtomicVersionIncrement(tutorialNavigationProgress.version),
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialNavigationProgress.id, existing.id),
            activeProgress // Soft-delete safety
          )
        )
        .returning(),
      'TutorialNavigationProgressRepository.markBlockCompleted.update'
    );

    if (!updated) {
      throw new Error('Failed to update progress for block completion (row may have been soft-deleted)');
    }

    return updated as TutorialNavigationProgressRecord;
  }

  /**
   * Check if specific block+version is completed
   */
  async isBlockCompleted(
    userId: string,
    navigationNodeId: string,
    blockId: string,
    blockVersion?: string
  ): Promise<boolean> {
    const progress = await this.getProgress(userId, navigationNodeId);
    if (!progress) {
      return false;
    }

    const completedBlocks = progress.completedBlocks ?? [];

    if (blockVersion) {
      // Check specific version
      return completedBlocks.some(
        (record) => record.blockId === blockId && record.blockVersion === blockVersion
      );
    }

    // Check any version
    return completedBlocks.some((record) => record.blockId === blockId);
  }

  /**
   * Record active time (cumulative)
   * 
   * Validates time increments to prevent abuse.
   * Creates progress record with initial time if doesn't exist.
   */
  async recordTime(event: TutorialTimeUpdateEvent): Promise<TutorialNavigationProgressRecord> {
    const now = new Date();

    // Validation: Prevent negative or unrealistic time values
    if (event.timeSpentActiveSec < 0) {
      throw new Error('Time spent cannot be negative');
    }

    // Prevent suspiciously large increments (e.g., > 1 hour in a single update)
    const MAX_SINGLE_INCREMENT = 3600; // 1 hour
    if (event.timeSpentActiveSec > MAX_SINGLE_INCREMENT) {
      throw new Error(`Time increment too large: ${event.timeSpentActiveSec}s (max: ${MAX_SINGLE_INCREMENT}s)`);
    }

    const existing = await this.getProgress(event.userId, event.navigationNodeId);

    if (!existing) {
      // Create new progress WITH initial time (not zero)
      // Time tracking should not create a visit - that's done by explicit visit events
      const [created] = await this.runRead(
        this.dbInstance
          .insert(tutorialNavigationProgress)
          .values({
            userId: event.userId,
            navigationNodeId: event.navigationNodeId,
            sectionId: null,
            subtopicId: event.subtopicId,
            status: 'not_started',
            completedBlocks: [],
            timeSpentActiveSec: event.timeSpentActiveSec, // Preserve initial time
            visitCount: 0, // Time event does NOT count as visit
            revisionCount: 0,
            lastSessionId: null, // Do not set session from time event - visit-owned only
            firstViewedAt: now, // Record when first tracked
            lastViewedAt: now,
            completedAt: null,
            version: 1,
            deletedAt: null,
          })
          .onConflictDoNothing({
            target: [
              tutorialNavigationProgress.userId,
              tutorialNavigationProgress.navigationNodeId,
            ],
            where: sql`${tutorialNavigationProgress.deletedAt} IS NULL`,
          })
          .returning(),
        'TutorialNavigationProgressRepository.recordTime.create'
      );

      if (created) {
        return created as TutorialNavigationProgressRecord;
      }

      // Conflict - retry with existing record
      const retry = await this.getProgress(event.userId, event.navigationNodeId);
      if (retry) {
        return this.recordTime(event); // Recursive retry
      }

      throw new Error('Failed to create progress for time tracking');
    }

    // Accumulate time atomically
    // NOTE: Does NOT update lastSessionId - that's visit-owned state
    const [updated] = await this.runRead(
      this.dbInstance
        .update(tutorialNavigationProgress)
        .set({
          timeSpentActiveSec: buildAtomicTimeIncrement(
            tutorialNavigationProgress.timeSpentActiveSec,
            event.timeSpentActiveSec
          ),
          lastViewedAt: now,
          version: buildAtomicVersionIncrement(tutorialNavigationProgress.version),
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialNavigationProgress.id, existing.id),
            activeProgress // Soft-delete safety
          )
        )
        .returning(),
      'TutorialNavigationProgressRepository.recordTime'
    );

    if (!updated) {
      throw new Error('Failed to update progress for time tracking (row may have been soft-deleted)');
    }

    return updated as TutorialNavigationProgressRecord;
  }

  /**
   * Record visit (session-aware, atomic session transition)
   * 
   * VISIT-OWNED STATE:
   * - lastSessionId: Updated ONLY by this method
   * - visitCount: Incremented atomically when sessionId changes
   * - revisionCount: Incremented atomically when visiting completed node in new session
   * - firstViewedAt: Set on first visit (when lastSessionId was null)
   * - lastViewedAt: Updated on every visit
   * 
   * SESSION CONTRACT:
   * - sessionId is REQUIRED (service must provide stable session identity)
   * - Authenticated: JWT family/session ID
   * - Anonymous: Stable client session UUID
   * 
   * CONCURRENCY SAFETY:
   * - Session transition decision made INSIDE atomic UPDATE (not from SELECT)
   * - Database determines if this request wins the session transition
   * - IS DISTINCT FROM comparison handles session changes atomically
   * - Prevents duplicate visit/revision increments under concurrent requests
   * 
   * OTHER EVENTS (recordTime, markBlockCompleted):
   * - Must NOT modify lastSessionId
   * - Must NOT modify visit counters
   * - May update lastViewedAt for tracking purposes
   */
  async recordVisit(event: TutorialVisitEvent): Promise<TutorialNavigationProgressRecord> {
    const now = event.occurredAt ?? new Date();
    const existing = await this.getProgress(event.userId, event.navigationNodeId);

    if (!existing) {
      // First visit - create new record
      const [created] = await this.runRead(
        this.dbInstance
          .insert(tutorialNavigationProgress)
          .values({
            userId: event.userId,
            navigationNodeId: event.navigationNodeId,
            sectionId: null,
            subtopicId: event.subtopicId,
            status: 'not_started',
            completedBlocks: [],
            timeSpentActiveSec: 0,
            visitCount: 1, // First visit
            revisionCount: 0,
            lastSessionId: event.sessionId,
            firstViewedAt: now,
            lastViewedAt: now,
            completedAt: null,
            version: 1,
            deletedAt: null,
          })
          .onConflictDoNothing({
            target: [
              tutorialNavigationProgress.userId,
              tutorialNavigationProgress.navigationNodeId,
            ],
            where: sql`${tutorialNavigationProgress.deletedAt} IS NULL`,
          })
          .returning(),
        'TutorialNavigationProgressRepository.recordVisit.create'
      );

      if (created) {
        return created as TutorialNavigationProgressRecord;
      }

      // Conflict - fetch and retry with existing record
      const retry = await this.getProgress(event.userId, event.navigationNodeId);
      if (!retry) {
        throw new Error('Failed to create or fetch progress for visit');
      }
      
      // Fall through to atomic update logic below
      return this.recordVisit(event);
    }

    // Atomic UPDATE with session transition decision made by database
    // This prevents race conditions where multiple concurrent requests with same new sessionId
    // could all read old lastSessionId and increment counters multiple times
    const [updated] = await this.runRead(
      this.dbInstance
        .update(tutorialNavigationProgress)
        .set({
          // Atomic visit count increment when session changes
          visitCount: buildAtomicVisitCountIncrement(
            tutorialNavigationProgress.visitCount,
            tutorialNavigationProgress.lastSessionId,
            event.sessionId
          ),
          
          // Atomic revision count increment when visiting completed node in new session
          revisionCount: buildAtomicRevisionCountIncrement(
            tutorialNavigationProgress.revisionCount,
            tutorialNavigationProgress.lastSessionId,
            tutorialNavigationProgress.status,
            event.sessionId
          ),
          
          // Set firstViewedAt if this is first visit (lastSessionId was null)
          firstViewedAt: buildAtomicFirstViewedAtInit(
            tutorialNavigationProgress.firstViewedAt,
            tutorialNavigationProgress.lastSessionId,
            now
          ),
          
          // Always update these
          lastViewedAt: now,
          lastSessionId: event.sessionId,
          version: buildAtomicVersionIncrement(tutorialNavigationProgress.version),
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialNavigationProgress.id, existing.id),
            activeProgress // Soft-delete safety
          )
        )
        .returning(),
      'TutorialNavigationProgressRepository.recordVisit'
    );

    if (!updated) {
      throw new Error('Failed to update progress for visit (row may have been soft-deleted)');
    }

    return updated as TutorialNavigationProgressRecord;
  }

  /**
   * Increment revision count (LEGACY/MANUAL - prefer recordVisit with sessionId)
   * 
   * This method exists for backward compatibility or explicit service-layer control.
   * 
   * PREFERRED APPROACH:
   * - Use recordVisit() with sessionId
   * - Revision detection happens automatically when:
   *   * Node status = 'completed'
   *   * sessionId different from lastSessionId
   * 
   * USE THIS METHOD ONLY IF:
   * - Service layer needs manual control over revision counting
   * - Implementing custom revision logic outside standard visit flow
   * 
   * NOTE: This increments BOTH visitCount and revisionCount.
   */
  async incrementRevision(
    userId: string,
    navigationNodeId: string
  ): Promise<TutorialNavigationProgressRecord> {
    const existing = await this.getProgress(userId, navigationNodeId);
    const now = new Date();

    if (!existing) {
      throw new Error('Cannot increment revision for non-existent progress');
    }

    const [updated] = await this.runRead(
      this.dbInstance
        .update(tutorialNavigationProgress)
        .set({
          revisionCount: buildAtomicTimeIncrement(
            tutorialNavigationProgress.revisionCount,
            1
          ),
          visitCount: buildAtomicTimeIncrement(
            tutorialNavigationProgress.visitCount,
            1
          ),
          lastViewedAt: now,
          version: buildAtomicVersionIncrement(tutorialNavigationProgress.version),
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialNavigationProgress.id, existing.id),
            activeProgress // Soft-delete safety
          )
        )
        .returning(),
      'TutorialNavigationProgressRepository.incrementRevision'
    );

    if (!updated) {
      throw new Error('Failed to increment revision (row may have been soft-deleted)');
    }

    return updated as TutorialNavigationProgressRecord;
  }

  /**
   * Mark navigation node as completed
   * 
   * COMPLETION POLICY:
   * - Repository does NOT validate completion eligibility
   * - Service layer determines: "All required blocks completed?"
   * - Service layer calls this method only when completion criteria met
   * 
   * Educational rules (D1/C1/S1 requirements) belong in service layer.
   */
  async completeNode(
    userId: string,
    navigationNodeId: string
  ): Promise<TutorialNavigationProgressRecord> {
    const existing = await this.getProgress(userId, navigationNodeId);
    const now = new Date();

    if (!existing) {
      throw new Error('Cannot complete non-existent progress');
    }

    // Idempotent: if already completed, return as-is
    if (existing.status === 'completed') {
      return existing;
    }

    const [updated] = await this.runRead(
      this.dbInstance
        .update(tutorialNavigationProgress)
        .set({
          status: 'completed',
          completedAt: now,
          lastViewedAt: now,
          version: buildAtomicVersionIncrement(tutorialNavigationProgress.version),
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialNavigationProgress.id, existing.id),
            activeProgress // Soft-delete safety
          )
        )
        .returning(),
      'TutorialNavigationProgressRepository.completeNode'
    );

    if (!updated) {
      throw new Error('Failed to complete node (row may have been soft-deleted)');
    }

    return updated as TutorialNavigationProgressRecord;
  }

  /**
   * Get completed navigation node IDs for a subtopic
   */
  async getCompletedNodes(userId: string, subtopicId: string): Promise<string[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select({ navigationNodeId: tutorialNavigationProgress.navigationNodeId })
        .from(tutorialNavigationProgress)
        .where(
          and(
            eq(tutorialNavigationProgress.userId, userId),
            eq(tutorialNavigationProgress.subtopicId, subtopicId),
            eq(tutorialNavigationProgress.status, 'completed'),
            activeProgress
          )
        ),
      'TutorialNavigationProgressRepository.getCompletedNodes'
    );

    return rows.map((row) => row.navigationNodeId);
  }

  /**
   * Check if navigation node is completed
   */
  async isNodeComplete(userId: string, navigationNodeId: string): Promise<boolean> {
    const progress = await this.getProgress(userId, navigationNodeId);
    return progress?.status === 'completed';
  }
}
