/**
 * Block Learning State Repository - Phase 4.2
 * 
 * Repository layer for per-block learner progress and telemetry.
 * 
 * IDENTITY: (userId, navigationNodeId, blockId, blockVersion)
 * 
 * RESPONSIBILITIES:
 * - Persistence and retrieval of block learning state
 * - Atomic counter updates (concurrent-safe)
 * - Soft-delete support
 * - Query by user, navigation node, completion status
 * 
 * NOT RESPONSIBLE FOR:
 * - Visit deduplication (service layer with session logic)
 * - Time comparison classification (future phase)
 * - Active block detection (ActiveBlockContext)
 * - expectedTimeSec calculation (from published document)
 * - Brand resolution (userId is already brand-scoped)
 */

import { and, eq, isNull, isNotNull, sql } from 'drizzle-orm';

import { db } from '../db';
import { blockLearningState } from '../schema/block-learning-state';

import type { TutorialDbClientLike } from '@quiz/types';
import {
  buildAtomicTimeIncrement,
  buildAtomicVersionIncrement,
} from './tutorial-navigation-progress-sql.helpers';

import { TutorialRepositoryBase } from './base.repository';

// ============================================================================
// Types
// ============================================================================

/**
 * Block identity - complete frozen identity
 */
export interface BlockIdentity {
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
}

/**
 * Create input - minimal data for new block state
 */
export interface CreateBlockLearningStateInput {
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  expectedTimeSec?: number | null;
}

/**
 * Update input - mutable fields only
 */
export interface UpdateBlockLearningStateInput {
  visitCount?: number;
  revisionCount?: number;
  activeTimeSec?: number;
  expectedTimeSec?: number | null;
  firstViewedAt?: Date | null;
  lastViewedAt?: Date | null;
  completedAt?: Date | null;
}

/**
 * Upsert input - identity + optional telemetry updates
 * 
 * Counters represent INCREMENTS when provided:
 * - visitCount: 1 to increment visit
 * - activeTimeSec: seconds to add
 */
export interface UpsertBlockLearningStateInput {
  // Identity (required)
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;

  // Telemetry (optional - treated as increments in conflict handler)
  visitCount?: number;
  revisionCount?: number;
  activeTimeSec?: number;
  expectedTimeSec?: number | null;

  // Timestamps (optional)
  firstViewedAt?: Date | null;
  lastViewedAt?: Date | null;
  completedAt?: Date | null;
}

/**
 * Block learning state record - inferred from schema
 */
export type BlockLearningState = typeof blockLearningState.$inferSelect;

// ============================================================================
// Repository
// ============================================================================

const activeBlockState = isNull(blockLearningState.deletedAt);

export class BlockLearningStateRepository extends TutorialRepositoryBase {
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new BlockLearningStateRepository(dbClient as typeof db) as this;
  }

  /**
   * Find block state by complete identity
   * 
   * Uses all four identity fields:
   * - userId: Learner
   * - navigationNodeId: Page context
   * - blockId: Block instance
   * - blockVersion: Content version (D1, C1, S1, etc.)
   * 
   * @returns Block state or null if not found
   */
  async findOne(identity: BlockIdentity): Promise<BlockLearningState | null> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(blockLearningState)
        .where(
          and(
            eq(blockLearningState.userId, identity.userId),
            eq(blockLearningState.navigationNodeId, identity.navigationNodeId),
            eq(blockLearningState.blockId, identity.blockId),
            eq(blockLearningState.blockVersion, identity.blockVersion),
            activeBlockState
          )
        ),
      'BlockLearningStateRepository.findOne'
    );

    return rows[0] ?? null;
  }

  /**
   * Create new block learning state
   * 
   * Initializes counters to 0, timestamps to null.
   * Service layer sets timestamps on actual events.
   * 
   * @throws If creation fails (e.g., unique constraint violation)
   */
  async create(data: CreateBlockLearningStateInput): Promise<BlockLearningState> {
    const [created] = await this.runRead(
      this.dbInstance
        .insert(blockLearningState)
        .values({
          userId: data.userId,
          navigationNodeId: data.navigationNodeId,
          blockId: data.blockId,
          blockVersion: data.blockVersion,
          expectedTimeSec: data.expectedTimeSec ?? null,
          visitCount: 0,
          revisionCount: 0,
          activeTimeSec: 0,
          firstViewedAt: null,
          lastViewedAt: null,
          completedAt: null,
          version: 1,
          deletedAt: null,
        })
        .returning(),
      'BlockLearningStateRepository.create'
    );

    if (!created) {
      throw new Error('Failed to create block learning state');
    }

    return created;
  }

  /**
   * Update existing block learning state
   * 
   * Updates only provided fields.
   * Atomic version increment for optimistic locking.
   * 
   * @throws If record not found or already deleted
   */
  async update(id: string, data: UpdateBlockLearningStateInput): Promise<BlockLearningState> {
    const now = new Date();

    const [updated] = await this.runRead(
      this.dbInstance
        .update(blockLearningState)
        .set({
          ...data,
          version: buildAtomicVersionIncrement(blockLearningState.version),
          updatedAt: now,
        })
        .where(and(eq(blockLearningState.id, id), activeBlockState))
        .returning(),
      'BlockLearningStateRepository.update'
    );

    if (!updated) {
      throw new Error('Failed to update block learning state (not found or deleted)');
    }

    return updated;
  }

  /**
   * Upsert block learning state (create or update)
   * 
   * CONCURRENCY-SAFE:
   * - Uses ON CONFLICT DO UPDATE with complete identity
   * - Atomic counter increments when updating
   * - Includes WHERE clause for partial unique index (deleted_at IS NULL)
   * 
   * COUNTER SEMANTICS:
   * - visitCount: Treated as INCREMENT on conflict (visitCount + provided value)
   * - revisionCount: Treated as INCREMENT on conflict
   * - activeTimeSec: Treated as INCREMENT on conflict (cumulative time)
   * 
   * FIRST INSERT:
   * - Creates record with provided values
   * - Counters default to 0 if not provided
   * 
   * SUBSEQUENT UPDATES:
   * - Atomically increments counters by provided amounts
   * - Updates timestamps if provided
   * - Preserves expectedTimeSec if not provided
   * 
   * @param data Identity + optional telemetry updates
   * @returns Created or updated block state
   */
  async upsert(data: UpsertBlockLearningStateInput): Promise<BlockLearningState> {
    const now = new Date();

    const [result] = await this.runRead(
      this.dbInstance
        .insert(blockLearningState)
        .values({
          // Identity
          userId: data.userId,
          navigationNodeId: data.navigationNodeId,
          blockId: data.blockId,
          blockVersion: data.blockVersion,

          // Telemetry (initial values)
          expectedTimeSec: data.expectedTimeSec ?? null,
          visitCount: data.visitCount ?? 0,
          revisionCount: data.revisionCount ?? 0,
          activeTimeSec: data.activeTimeSec ?? 0,

          // Timestamps (initial values)
          firstViewedAt: data.firstViewedAt ?? null,
          lastViewedAt: data.lastViewedAt ?? null,
          completedAt: data.completedAt ?? null,

          // Audit
          version: 1,
          deletedAt: null,
        })
        .onConflictDoUpdate({
          // Complete identity for conflict detection
          target: [
            blockLearningState.userId,
            blockLearningState.navigationNodeId,
            blockLearningState.blockId,
            blockLearningState.blockVersion,
          ],
          // WHERE clause for partial unique index (active records only)
          where: sql`${blockLearningState.deletedAt} IS NULL`,
          // Atomic updates on conflict
          set: {
            // Atomic counter increments (cumulative)
            visitCount:
              data.visitCount !== undefined
                ? buildAtomicTimeIncrement(blockLearningState.visitCount, data.visitCount)
                : blockLearningState.visitCount,
            revisionCount:
              data.revisionCount !== undefined
                ? buildAtomicTimeIncrement(blockLearningState.revisionCount, data.revisionCount)
                : blockLearningState.revisionCount,
            activeTimeSec:
              data.activeTimeSec !== undefined
                ? buildAtomicTimeIncrement(blockLearningState.activeTimeSec, data.activeTimeSec)
                : blockLearningState.activeTimeSec,

            // Update other fields if provided, preserve if not
            expectedTimeSec:
              data.expectedTimeSec !== undefined ? data.expectedTimeSec : blockLearningState.expectedTimeSec,
            firstViewedAt:
              data.firstViewedAt !== undefined ? data.firstViewedAt : blockLearningState.firstViewedAt,
            lastViewedAt: data.lastViewedAt ?? now, // Always update lastViewedAt
            completedAt: data.completedAt !== undefined ? data.completedAt : blockLearningState.completedAt,

            // Audit
            version: buildAtomicVersionIncrement(blockLearningState.version),
            updatedAt: now,
          },
        })
        .returning(),
      'BlockLearningStateRepository.upsert'
    );

    if (!result) {
      throw new Error('Failed to upsert block learning state');
    }

    return result;
  }

  /**
   * Find all block states for a user
   * 
   * @returns All active block states for user, ordered by most recent first
   */
  async findByUser(userId: string): Promise<BlockLearningState[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(blockLearningState)
        .where(and(eq(blockLearningState.userId, userId), activeBlockState))
        .orderBy(sql`${blockLearningState.lastViewedAt} DESC NULLS LAST`),
      'BlockLearningStateRepository.findByUser'
    );

    return rows;
  }

  /**
   * Find all block states for a navigation node
   * 
   * Scoped by BOTH userId and navigationNodeId for security.
   * 
   * @returns All active block states for user+node
   */
  async findByNavigationNode(userId: string, navigationNodeId: string): Promise<BlockLearningState[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(blockLearningState)
        .where(
          and(
            eq(blockLearningState.userId, userId),
            eq(blockLearningState.navigationNodeId, navigationNodeId),
            activeBlockState
          )
        ),
      'BlockLearningStateRepository.findByNavigationNode'
    );

    return rows;
  }

  /**
   * Find completed block states for a user
   * 
   * Completion determined by completedAt IS NOT NULL.
   * 
   * @returns All completed block states, ordered by completion time
   */
  async findCompleted(userId: string): Promise<BlockLearningState[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(blockLearningState)
        .where(
          and(
            eq(blockLearningState.userId, userId),
            isNotNull(blockLearningState.completedAt),
            activeBlockState
          )
        )
        .orderBy(sql`${blockLearningState.completedAt} ASC`),
      'BlockLearningStateRepository.findCompleted'
    );

    return rows;
  }

  /**
   * Soft-delete block learning state
   * 
   * Sets deletedAt timestamp.
   * Deleted records excluded from queries (activeBlockState filter).
   * Partial unique index allows new active record with same identity.
   */
  async softDelete(id: string): Promise<void> {
    const now = new Date();

    await this.runRead(
      this.dbInstance
        .update(blockLearningState)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(and(eq(blockLearningState.id, id), activeBlockState)),
      'BlockLearningStateRepository.softDelete'
    );
  }
}
