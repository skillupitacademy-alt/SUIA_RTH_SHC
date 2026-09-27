/**
 * Instructional Block Completion Evaluator - Phase 2B.18
 * 
 * PURPOSE:
 * Generic completion evaluation for instructional blocks based on
 * active time compared to expected time threshold.
 * 
 * POLICY:
 * activeTimeSec >= expectedTimeSec × 0.80 → eligible for automatic completion
 * 
 * ARCHITECTURAL PRINCIPLES:
 * - Pure function module (no side effects, no state, no I/O)
 * - Generic evaluation (not block-specific - applies to all progressRole='instructional')
 * - Does NOT persist completion (triggers existing completion pipeline)
 * - Does NOT track time (consumes existing telemetry data)
 * - Does NOT implement revision logic (reuses existing repository logic)
 * 
 * SEPARATION OF CONCERNS:
 * - Evaluator: WHEN to complete (this module)
 * - tutorialTrackingService: HOW to persist (existing pipeline)
 * - BlockTelemetryProvider: WHAT time to track (existing telemetry)
 * - BlockLearningStateRepository: HOW revisions work (existing atomic logic)
 * 
 * CONTRACT UPDATE (Phase 2B.18):
 * - expectedTimeSec now has TWO roles:
 *   1. Analytics metadata (Phase 2B.14)
 *   2. Completion threshold input (Phase 2B.18 - NEW)
 * - Missing expectedTimeSec: automatic completion disabled, manual fallback
 * - progressRole remains authoritative for completion eligibility
 */

/**
 * Completion threshold ratio
 * Instructional block is considered complete when:
 * activeTimeSec >= expectedTimeSec × COMPLETION_TIME_RATIO
 */
export const COMPLETION_TIME_RATIO = 0.80;

/**
 * Block metadata required for completion evaluation
 */
export interface InstructionalBlockMetadata {
  /**
   * Block UUID
   */
  blockId: string;
  
  /**
   * Block content version (D1, C1, I1, S1, etc.)
   */
  blockVersion: string;
  
  /**
   * Progress role - determines completion eligibility
   * Only 'instructional' blocks are eligible for automatic time-based completion
   */
  progressRole: 'instructional' | 'structural' | 'assessment' | 'media';
  
  /**
   * Expected time to complete this block (seconds)
   * Dual role (Phase 2B.18):
   * 1. Analytics metadata
   * 2. Completion threshold input
   * 
   * undefined = automatic completion disabled (manual fallback)
   */
  expectedTimeSec?: number;
}

/**
 * Telemetry data for completion evaluation
 */
export interface BlockTelemetryData {
  /**
   * Block UUID (must match metadata.blockId)
   */
  blockId: string;
  
  /**
   * Block version (must match metadata.blockVersion)
   */
  blockVersion: string;
  
  /**
   * Cumulative active time spent on this block (seconds)
   * Source: BlockTelemetryProvider → ILS API → block_learning_state.activeTimeSec
   */
  activeTimeSec: number;
}

/**
 * Completion evaluation result
 */
export interface CompletionEvaluation {
  /**
   * Is the block eligible for automatic completion?
   * true = should trigger existing completion pipeline
   * false = do not complete (may need more time, or not instructional)
   */
  shouldComplete: boolean;
  
  /**
   * Human-readable reason for decision
   */
  reason: string;
  
  /**
   * Completion progress ratio (0.0 - 1.0+)
   * Calculated as: activeTimeSec / expectedTimeSec
   * undefined = cannot calculate (missing expectedTimeSec)
   */
  completionRatio?: number;
  
  /**
   * Required threshold ratio for completion
   * Always COMPLETION_TIME_RATIO (0.80)
   */
  thresholdRatio: number;
}

/**
 * Evaluate if an instructional block should be automatically completed
 * 
 * PURE FUNCTION:
 * - No side effects
 * - Deterministic output for same inputs
 * - No I/O, no state mutation, no async
 * 
 * GENERIC ALGORITHM:
 * - Applies to ALL progressRole='instructional' blocks (D1, C1, I1, S1, future versions)
 * - No block-specific branches
 * - Single formula: activeTimeSec >= expectedTimeSec × 0.80
 * 
 * ELIGIBILITY REQUIREMENTS:
 * 1. progressRole === 'instructional' (Phase 2B.13 contract - progressRole controls eligibility)
 * 2. expectedTimeSec is defined and > 0 (Phase 2B.18 update - threshold input)
 * 3. activeTimeSec >= expectedTimeSec × 0.80 (Phase 2B.18 policy)
 * 
 * MISSING expectedTimeSec:
 * - Returns shouldComplete=false with reason explaining missing threshold
 * - Caller should provide manual completion fallback
 * - Analytics gracefully degrades
 * 
 * IDENTITY VALIDATION:
 * - blockId and blockVersion must match between metadata and telemetry
 * - Prevents evaluation with mismatched data
 * 
 * @param metadata Block metadata (from published tutorial document)
 * @param telemetry Block telemetry data (from ILS block_learning_state)
 * @returns Completion evaluation decision
 * @throws Error if blockId or blockVersion mismatch
 */
export function evaluateInstructionalBlockCompletion(
  metadata: InstructionalBlockMetadata,
  telemetry: BlockTelemetryData
): CompletionEvaluation {
  // Validate identity consistency
  if (metadata.blockId !== telemetry.blockId) {
    throw new Error(
      `[InstructionalBlockCompletion] Block ID mismatch: metadata=${metadata.blockId}, telemetry=${telemetry.blockId}`
    );
  }
  
  if (metadata.blockVersion !== telemetry.blockVersion) {
    throw new Error(
      `[InstructionalBlockCompletion] Block version mismatch: metadata=${metadata.blockVersion}, telemetry=${telemetry.blockVersion}`
    );
  }
  
  // Check progressRole eligibility (Phase 2B.13 contract)
  if (metadata.progressRole !== 'instructional') {
    return {
      shouldComplete: false,
      reason: `Block progressRole is '${metadata.progressRole}' (not instructional) - automatic completion does not apply`,
      thresholdRatio: COMPLETION_TIME_RATIO,
    };
  }
  
  // Check expectedTimeSec availability (Phase 2B.18 threshold input)
  if (metadata.expectedTimeSec === undefined || metadata.expectedTimeSec <= 0) {
    return {
      shouldComplete: false,
      reason: 'Missing or invalid expectedTimeSec - automatic completion disabled (manual fallback available)',
      thresholdRatio: COMPLETION_TIME_RATIO,
    };
  }
  
  // Calculate completion ratio
  const completionRatio = telemetry.activeTimeSec / metadata.expectedTimeSec;
  
  // Evaluate threshold (Phase 2B.18 policy)
  const meetsThreshold = completionRatio >= COMPLETION_TIME_RATIO;
  
  if (meetsThreshold) {
    return {
      shouldComplete: true,
      reason: `Active time (${telemetry.activeTimeSec}s) >= ${COMPLETION_TIME_RATIO * 100}% of expected time (${metadata.expectedTimeSec}s)`,
      completionRatio,
      thresholdRatio: COMPLETION_TIME_RATIO,
    };
  }
  
  // Not yet complete
  const remainingSec = Math.ceil(metadata.expectedTimeSec * COMPLETION_TIME_RATIO - telemetry.activeTimeSec);
  
  return {
    shouldComplete: false,
    reason: `Need ${remainingSec}s more active time to reach ${COMPLETION_TIME_RATIO * 100}% threshold`,
    completionRatio,
    thresholdRatio: COMPLETION_TIME_RATIO,
  };
}

/**
 * Batch evaluate multiple blocks for completion
 * 
 * Convenience wrapper for evaluating multiple blocks at once.
 * Useful for page-level progress calculation.
 * 
 * @param blocks Array of [metadata, telemetry] pairs
 * @returns Array of evaluations (preserves input order)
 */
export function evaluateMultipleBlocks(
  blocks: Array<[InstructionalBlockMetadata, BlockTelemetryData]>
): CompletionEvaluation[] {
  return blocks.map(([metadata, telemetry]) =>
    evaluateInstructionalBlockCompletion(metadata, telemetry)
  );
}

/**
 * Check if any blocks meet completion threshold
 * 
 * Useful for detecting if any blocks need to be completed in batch operations.
 * 
 * @param evaluations Array of completion evaluations
 * @returns true if at least one block should be completed
 */
export function hasBlocksReadyForCompletion(
  evaluations: CompletionEvaluation[]
): boolean {
  return evaluations.some(e => e.shouldComplete);
}

/**
 * Filter blocks that meet completion threshold
 * 
 * Returns indices of blocks that should be completed.
 * Useful for identifying which blocks to trigger completion for.
 * 
 * @param evaluations Array of completion evaluations
 * @returns Array of indices where shouldComplete=true
 */
export function getReadyBlockIndices(
  evaluations: CompletionEvaluation[]
): number[] {
  return evaluations
    .map((e, i) => (e.shouldComplete ? i : -1))
    .filter(i => i !== -1);
}
