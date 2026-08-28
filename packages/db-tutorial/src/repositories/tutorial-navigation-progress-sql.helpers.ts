/**
 * Phase 2.6: Tutorial Navigation Progress SQL Helpers
 * 
 * Complex SQL expressions for atomic progress operations.
 * Extracted from tutorial-navigation-progress.repository.ts for better modularity.
 * 
 * These helpers encapsulate:
 * - Atomic JSONB operations for block completion
 * - Atomic session transition logic for visits
 * - Concurrent-safe counter increments
 * - Deduplication checks
 */

import { sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { CompletedBlockRecord } from '@quiz/types';

/**
 * Build atomic JSONB append with deduplication for block completion
 * 
 * Prevents both lost updates AND duplicate entries under concurrent execution.
 * Uses EXISTS check to determine if block+version already exists.
 * 
 * Logic:
 * - IF block+version exists → return current array unchanged
 * - ELSE → append new completion record
 * 
 * @param completedBlocksColumn - The JSONB column reference
 * @param blockId - Block identifier
 * @param blockVersion - Block version (e.g., "D1", "C1", "S1")
 * @param newRecord - New completion record to append
 */
export function buildAtomicBlockAppend(
  completedBlocksColumn: PgColumn,
  blockId: string,
  blockVersion: string,
  newRecord: CompletedBlockRecord
): SQL {
  return sql`
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM jsonb_array_elements(${completedBlocksColumn}) AS block
        WHERE block->>'blockId' = ${blockId}
          AND block->>'blockVersion' = ${blockVersion}
      )
      THEN ${completedBlocksColumn}
      ELSE ${completedBlocksColumn} || ${JSON.stringify([newRecord])}::jsonb
    END
  `;
}

/**
 * Build atomic visit count increment based on session transition
 * 
 * Increments visitCount only when sessionId changes.
 * Database determines session transition atomically to prevent race conditions.
 * 
 * Uses IS DISTINCT FROM to handle null sessions correctly:
 * - NULL IS DISTINCT FROM 'session-123' → true (increment)
 * - 'session-123' IS DISTINCT FROM 'session-123' → false (no increment)
 * - 'session-123' IS DISTINCT FROM 'session-456' → true (increment)
 * 
 * @param visitCountColumn - The visit count column reference
 * @param lastSessionIdColumn - The last session ID column reference
 * @param newSessionId - New session ID from current visit
 */
export function buildAtomicVisitCountIncrement(
  visitCountColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  newSessionId: string
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS DISTINCT FROM ${newSessionId}
      THEN ${visitCountColumn} + 1
      ELSE ${visitCountColumn}
    END
  `;
}

/**
 * Build atomic revision count increment for completed nodes
 * 
 * Increments revisionCount when:
 * 1. Session changes (lastSessionId IS DISTINCT FROM newSessionId)
 * 2. AND node status is 'completed'
 * 
 * This implements the revision semantic:
 * "Returning to a completed node in a new learning session counts as a revision"
 * 
 * @param revisionCountColumn - The revision count column reference
 * @param lastSessionIdColumn - The last session ID column reference
 * @param statusColumn - The status column reference
 * @param newSessionId - New session ID from current visit
 */
export function buildAtomicRevisionCountIncrement(
  revisionCountColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  statusColumn: PgColumn,
  newSessionId: string
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS DISTINCT FROM ${newSessionId}
        AND ${statusColumn} = 'completed'
      THEN ${revisionCountColumn} + 1
      ELSE ${revisionCountColumn}
    END
  `;
}

/**
 * Build atomic firstViewedAt initialization
 * 
 * Sets firstViewedAt to current timestamp ONLY if it hasn't been set yet.
 * Determined by checking if lastSessionId is NULL (no prior visit).
 * 
 * Logic:
 * - IF lastSessionId IS NULL → set to current timestamp (first visit)
 * - ELSE → preserve existing firstViewedAt
 * 
 * @param firstViewedAtColumn - The firstViewedAt column reference
 * @param lastSessionIdColumn - The last session ID column reference
 * @param currentTimestamp - Current timestamp to set
 */
export function buildAtomicFirstViewedAtInit(
  firstViewedAtColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  currentTimestamp: Date
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS NULL
      THEN ${currentTimestamp}
      ELSE ${firstViewedAtColumn}
    END
  `;
}

/**
 * Build atomic time accumulation
 * 
 * Simple increment for cumulative time tracking.
 * 
 * @param timeSpentColumn - The time spent column reference
 * @param incrementSeconds - Seconds to add
 */
export function buildAtomicTimeIncrement(
  timeSpentColumn: PgColumn,
  incrementSeconds: number
): SQL {
  return sql`${timeSpentColumn} + ${incrementSeconds}`;
}

/**
 * Build atomic version increment
 * 
 * Standard optimistic locking version increment.
 * 
 * @param versionColumn - The version column reference
 */
export function buildAtomicVersionIncrement(versionColumn: PgColumn): SQL {
  return sql`${versionColumn} + 1`;
}
