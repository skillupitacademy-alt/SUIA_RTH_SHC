/**
 * Phase 2.6-A3: Learning Progress Aggregation
 * 
 * Pure learning-state aggregation and calculation functions.
 * Extracted from learning-progress.service.ts for better modularity.
 * 
 * These functions are stateless and deterministic - they do not:
 * - Access the database
 * - Access repositories
 * - Access HTTP/authentication
 * - Mutate persistence records
 * 
 * They receive explicit inputs and return explicit outputs.
 */

import type { CompletedBlockRecord, TutorialNavigationProgressRecord } from '@quiz/types';
import type { LearningState, CompletionDecision } from './learning-progress.types';

/**
 * Determine semantic learning state
 * 
 * Maps database status to semantic learning state.
 * Frontend will map these to visual representations.
 * 
 * Phase 2.6-A3: Direct mapping
 * Phase 2.6-B: Can extend with NEEDS_REVISION, NEEDS_PRACTICE logic
 */
export function determineLearningState(
  status: 'not_started' | 'in_progress' | 'completed'
): LearningState {
  // Direct mapping for Phase 2.6-A3
  // Phase 2.6-B can add NEEDS_REVISION, NEEDS_PRACTICE logic
  return status;
}

/**
 * Aggregate parent learning state from children
 * 
 * Deterministic roll-up logic:
 * - Empty children → NOT_AVAILABLE
 * - All children NOT_AVAILABLE → NOT_AVAILABLE
 * - All available children COMPLETED → COMPLETED
 * - Any available child IN_PROGRESS → IN_PROGRESS
 * - Some completed + some not started → IN_PROGRESS
 * - All available NOT_STARTED → NOT_STARTED
 * - Unexpected combinations → IN_PROGRESS (safe default)
 * 
 * IMPORTANT: Mixed completion states resolve to IN_PROGRESS, not COMPLETED.
 */
export function aggregateParentState(childStates: LearningState[]): LearningState {
  if (childStates.length === 0) {
    return 'not_available';
  }

  // All unavailable
  if (childStates.every((state) => state === 'not_available')) {
    return 'not_available';
  }

  // Filter available children
  const availableStates = childStates.filter((state) => state !== 'not_available');

  if (availableStates.length === 0) {
    return 'not_available';
  }

  // All available completed
  if (availableStates.every((state) => state === 'completed')) {
    return 'completed';
  }

  // Any in progress
  if (availableStates.some((state) => state === 'in_progress')) {
    return 'in_progress';
  }

  // Mixed completed + not started = in progress
  const hasCompleted = availableStates.some((state) => state === 'completed');
  const hasNotStarted = availableStates.some((state) => state === 'not_started');

  if (hasCompleted && hasNotStarted) {
    return 'in_progress';
  }

  // All not started
  if (availableStates.every((state) => state === 'not_started')) {
    return 'not_started';
  }

  // Default to in_progress for unexpected combinations
  return 'in_progress';
}

/**
 * Calculate progress percentage
 * 
 * Formula: (completedRequiredBlocks / totalRequiredBlocks) × 100
 * 
 * Handles edge cases:
 * - No required blocks: 100% (vacuously complete)
 * - Zero completed: 0%
 * - Partial: 1-99%
 * - All complete: 100%
 * 
 * ZERO-REQUIRED-BLOCKS SEMANTIC:
 * - Content with no requirements → 100% complete
 * - Consistent with canComplete=true for zero requirements
 * - Use case: Informational pages, conceptual content
 */
export function calculateProgressPercentage(
  completedBlocks: CompletedBlockRecord[],
  requiredBlocks: Array<{ blockId: string; blockVersion: string }>
): number {
  // Zero required blocks = vacuously complete
  if (requiredBlocks.length === 0) {
    return 100;
  }

  const completedCount = requiredBlocks.filter((required) =>
    completedBlocks.some(
      (completed) =>
        completed.blockId === required.blockId &&
        completed.blockVersion === required.blockVersion
    )
  ).length;

  const percentage = (completedCount / requiredBlocks.length) * 100;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(percentage)));
}
