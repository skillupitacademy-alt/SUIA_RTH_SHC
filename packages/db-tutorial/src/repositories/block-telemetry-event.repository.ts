/**
 * Phase D-2: Block Telemetry Event Repository
 * 
 * Implements idempotent active-time event claiming using ON CONFLICT DO NOTHING.
 * 
 * CRITICAL DESIGN:
 * - claimEvent() uses .onConflictDoNothing() - NO exception-driven flow
 * - Returns BlockTelemetryEvent for new event, null for duplicate
 * - Caller must validate payload immutability for duplicates
 * - Transaction-safe via withDb() pattern
 */

import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db'; // Use actual db type, not TutorialDbClientLike
import { blockTelemetryEvents, type BlockTelemetryEvent, type BlockTelemetryEventInsert } from '../schema';

export class BlockTelemetryEventRepository {
  constructor(private dbInstance: typeof db = db) {}

  /**
   * Create repository instance with specific database client
   * (enables transaction support via withDb(tx))
   */
  withDb(dbClient: typeof db): BlockTelemetryEventRepository {
    return new BlockTelemetryEventRepository(dbClient);
  }

  /**
   * Claim an event atomically
   * 
   * ON CONFLICT DO NOTHING semantics:
   * - If event_id is new: inserts and returns the event
   * - If event_id exists: returns null (no exception thrown)
   * 
   * This enables clean control flow without catching PostgreSQL 23505 errors
   * inside transactions.
   * 
   * @returns BlockTelemetryEvent if claimed (new), null if already exists
   */
  async claimEvent(input: Omit<BlockTelemetryEventInsert, 'id' | 'processedAt' | 'createdAt'>): Promise<BlockTelemetryEvent | null> {
    const result = await this.dbInstance
      .insert(blockTelemetryEvents)
      .values({
        eventId: input.eventId,
        userId: input.userId,
        navigationNodeId: input.navigationNodeId,
        blockId: input.blockId,
        blockVersion: input.blockVersion,
        activeTimeSec: input.activeTimeSec,
      })
      .onConflictDoNothing({
        target: blockTelemetryEvents.eventId,
      })
      .returning();

    // If row returned = new event claimed
    // If no row returned = event already exists
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find event by event ID
   * 
   * Used for:
   * - Payload immutability validation on duplicate delivery
   * - Audit queries
   */
  async findByEventId(eventId: string): Promise<BlockTelemetryEvent | null> {
    const result = await this.dbInstance
      .select()
      .from(blockTelemetryEvents)
      .where(eq(blockTelemetryEvents.eventId, eventId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find events by block identity
   * 
   * Used for:
   * - Audit/debugging
   * - Verifying event history survives block_learning_state lifecycle
   */
  async findByBlockIdentity(
    userId: string,
    navigationNodeId: string,
    blockId: string,
    blockVersion: string
  ): Promise<BlockTelemetryEvent[]> {
    return await this.dbInstance
      .select()
      .from(blockTelemetryEvents)
      .where(
        and(
          eq(blockTelemetryEvents.userId, userId),
          eq(blockTelemetryEvents.navigationNodeId, navigationNodeId),
          eq(blockTelemetryEvents.blockId, blockId),
          eq(blockTelemetryEvents.blockVersion, blockVersion)
        )
      )
      .orderBy(blockTelemetryEvents.processedAt);
  }

  /**
   * Count events for block (diagnostic/testing)
   */
  async countByBlockIdentity(
    userId: string,
    navigationNodeId: string,
    blockId: string,
    blockVersion: string
  ): Promise<number> {
    const result = await this.dbInstance
      .select({ count: sql<number>`COUNT(*)` })
      .from(blockTelemetryEvents)
      .where(
        and(
          eq(blockTelemetryEvents.userId, userId),
          eq(blockTelemetryEvents.navigationNodeId, navigationNodeId),
          eq(blockTelemetryEvents.blockId, blockId),
          eq(blockTelemetryEvents.blockVersion, blockVersion)
        )
      );

    return Number(result[0]?.count ?? 0);
  }
}
