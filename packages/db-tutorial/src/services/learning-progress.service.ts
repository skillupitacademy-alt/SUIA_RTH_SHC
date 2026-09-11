/**
 * Phase 2.6-A3: Learning Progress Service
 * 
 * Business logic layer for learner progress tracking.
 * 
 * ARCHITECTURE:
 * 
 * API/Runtime
 *       ↓
 * LearningProgressService  ← THIS LAYER
 *       ↓
 * NavigationProgressRepository
 *       ↓
 * tutorial_navigation_progress
 * 
 * RESPONSIBILITIES:
 * - Identity validation
 * - Navigation node validation
 * - Business rule enforcement (visit, revision, completion)
 * - Progress calculation (via aggregation module)
 * - Learning state determination (via aggregation module)
 * - Parent aggregation (via aggregation module)
 * 
 * NOT RESPONSIBILITIES:
 * - Direct database access
 * - SQL generation
 * - Browser visibility tracking (Phase 2.6-B)
 * - GUI rendering (Phase 2.6-C)
 */

import type {
  CompletedBlockRecord,
  ITutorialNavigationProgressRepository,
  TutorialNavigationProgressRecord,
  TutorialNavigationProgressCreateInput,
  TutorialBlockCompletionEvent,
  TutorialTimeUpdateEvent,
  TutorialVisitEvent,
} from '@quiz/types';
import type { TutorialSectionRepository } from '../repositories/tutorial-section.repository';
import type { BlockLearningStateRepository, BlockLearningState } from '../repositories/block-learning-state.repository';
import type { BlockTelemetryEventRepository } from '../repositories/block-telemetry-event.repository'; // Phase D-2
import { db } from '../db'; // Phase D-2: For transactions (use actual db, not TutorialDbClientLike)
import {
  type LearningState,
  type AuthenticatedIdentity,
  type NavigationProgressDTO,
  type NavigationProgressWithCalculatedDTO,
  type BlockLearningStateDTO,
  type CompletionDecision,
  LearningProgressError,
  NavigationNodeNotFoundError,
  UnauthorizedProgressAccessError,
  InvalidBlockCompletionError,
  InvalidNavigationHierarchyError,
  InvalidTimeUpdateError,
} from './learning-progress.types';
import {
  determineLearningState as determineLearningStateImpl,
  aggregateParentState as aggregateParentStateImpl,
  calculateProgressPercentage as calculateProgressPercentageImpl,
} from './learning-progress.aggregation';
import {
  validateUserId,
  validateNavigationNodeId,
  validateSessionId,
  validateBlockId,
  validateBlockVersion,
  validateSubtopicId,
  validateEventId, // Phase D-2
} from './learning-progress.validation';
import {
  resolveRequiredBlocks as resolveRequiredBlocksImpl,
  validateNavigationHierarchy as validateNavigationHierarchyImpl,
} from './learning-progress.hierarchy-resolution';

// Re-export types for convenience
export type {
  LearningState,
  AuthenticatedIdentity,
  NavigationProgressDTO,
  NavigationProgressWithCalculatedDTO,
  BlockLearningStateDTO,
  CompletionDecision,
};

// Re-export errors
export {
  LearningProgressError,
  NavigationNodeNotFoundError,
  UnauthorizedProgressAccessError,
  InvalidBlockCompletionError,
  InvalidNavigationHierarchyError,
  InvalidTimeUpdateError,
};

/**
 * Learning Progress Service
 * 
 * Orchestrates learner progress business logic using the approved
 * Phase 2.6-A1/A2.1 navigation progress repository.
 * 
 * AUTHORIZATION BOUNDARY:
 * - Service requires AuthenticatedIdentity context for all operations
 * - Validates userId matches authenticated identity
 * - Prevents cross-user progress access
 * - Brand-scoped content access (when brand provided in identity)
 * 
 * HIERARCHY VALIDATION:
 * - Validates navigationNodeId belongs to subtopicId via tutorial sections
 * - Validates sectionId consistency when provided
 * - Rejects inconsistent hierarchy combinations
 * 
 * RESPONSIBILITY BOUNDARY:
 * 
 * SERVICE (this layer):
 * - Educational completion rules (required blocks)
 * - Eligibility validation
 * - Business logic orchestration
 * - Session ID management
 * - Authorization enforcement
 * - Hierarchy validation
 * 
 * REPOSITORY (Phase 2.6-A1/A2.1):
 * - Atomic persistence mutations
 * - Concurrency safety
 * - Idempotency guarantees
 * - Session transition decision (atomic SQL CASE)
 * - Automatic revision detection (completed + session change)
 * 
 * TIME EVENT SEMANTICS:
 * - recordActiveTime() CAN create progress record if none exists
 * - Result: visitCount=0, timeSpentActiveSec>0, status=not_started
 * - Rationale: Browser heartbeat may occur before explicit visit
 * - Visit semantics remain separate (established by recordVisit only)
 */
export class LearningProgressService {
  constructor(
    private readonly progressRepository: ITutorialNavigationProgressRepository,
    private readonly sectionRepository: TutorialSectionRepository,
    private readonly blockLearningStateRepository: BlockLearningStateRepository,
    private readonly blockTelemetryEventRepository: BlockTelemetryEventRepository // Phase D-2
  ) {}

  /**
   * Get navigation progress for a learner
   * 
   * Returns existing progress or creates minimal progress record.
   * Does NOT manufacture a visit - visits require explicit recordVisit().
   * 
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   * HIERARCHY: Validates navigationNodeId belongs to subtopicId using authenticated brand
   * PROGRESS: Returns REAL calculated progress from canonical section content
   */
  async getNavigationProgress(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string,
    sectionId?: string | null
  ): Promise<NavigationProgressWithCalculatedDTO> {
    // Validate identity and authorization
    validateUserId(identity.userId);
    validateNavigationNodeId(navigationNodeId);

    // Validate hierarchy consistency using authenticated brand
    await this.validateNavigationHierarchy(
      navigationNodeId,
      subtopicId,
      sectionId,
      identity
    );

    // Get or create progress
    let progress = await this.progressRepository.getProgress(
      identity.userId,
      navigationNodeId
    );

    if (!progress) {
      // Create minimal progress WITHOUT manufacturing a visit
      progress = await this.progressRepository.createProgress({
        userId: identity.userId,
        navigationNodeId,
        sectionId: sectionId ?? null,
        subtopicId,
      });
    }

    // Resolve required blocks from canonical content
    const requiredBlocks = await this.resolveRequiredBlocks(
      subtopicId,
      navigationNodeId,
      identity
    );

    // Gate 3C.1R: Fetch block-level telemetry state
    const blockStates = await this.blockLearningStateRepository.findByNavigationNode(
      identity.userId,
      navigationNodeId
    );

    return this.toDTO(progress, requiredBlocks, blockStates);
  }

  /**
   * Get all navigation progress for a subtopic
   * 
   * Returns progress for all navigation nodes under a subtopic.
   * 
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   * PROGRESS: Returns REAL calculated progress for each navigation node
   */
  async getSubtopicProgress(
    identity: AuthenticatedIdentity,
    subtopicId: string
  ): Promise<NavigationProgressWithCalculatedDTO[]> {
    validateUserId(identity.userId);

    const progressRecords = await this.progressRepository.getProgressForSubtopic(
      identity.userId,
      subtopicId
    );

    // Resolve required blocks for each navigation node
    const results: NavigationProgressWithCalculatedDTO[] = [];
    for (const record of progressRecords) {
      const requiredBlocks = await this.resolveRequiredBlocks(
        record.subtopicId,
        record.navigationNodeId,
        identity
      );
      
      // Gate 3C.1R: Fetch block-level telemetry state
      const blockStates = await this.blockLearningStateRepository.findByNavigationNode(
        identity.userId,
        record.navigationNodeId
      );
      
      results.push(this.toDTO(record, requiredBlocks, blockStates));
    }

    return results;
  }

  /**
   * Record a learner visit to a navigation node
   * 
   * VISIT SEMANTICS:
   * - First visit: visitCount = 1, establishes firstViewedAt
   * - Same session: visitCount unchanged
   * - New session: visitCount + 1
   * - New session + completed node: revisionCount + 1
   * 
   * SESSION CONTRACT:
   * - sessionId from identity OR explicit parameter
   * - MUST be stable learning session identifier
   * - Authenticated: JWT family/session ID
   * - Anonymous: Client-generated UUID
   * 
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   * HIERARCHY: Validates navigationNodeId belongs to subtopicId using authenticated brand
   * PROGRESS: Returns REAL calculated progress from canonical section content
   */
  async recordVisit(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string,
    sessionId: string,
    sectionId?: string | null
  ): Promise<NavigationProgressWithCalculatedDTO> {
    // Validate inputs
    validateUserId(identity.userId);
    validateNavigationNodeId(navigationNodeId);
    validateSessionId(sessionId);

    // Validate hierarchy using authenticated brand
    await this.validateNavigationHierarchy(
      navigationNodeId,
      subtopicId,
      sectionId,
      identity
    );

    // Ensure progress exists
    await this.getNavigationProgress(identity, navigationNodeId, subtopicId, sectionId);

    // Record visit - repository handles atomic session transition
    const event: TutorialVisitEvent = {
      userId: identity.userId,
      navigationNodeId,
      subtopicId,
      sessionId,
      occurredAt: new Date(),
    };

    const updated = await this.progressRepository.recordVisit(event);

    // Resolve required blocks from canonical content
    const requiredBlocks = await this.resolveRequiredBlocks(
      subtopicId,
      navigationNodeId,
      identity
    );

    // Gate 3C.1R: Return without re-fetching block states for write operations
    return this.toDTO(updated, requiredBlocks, []);
  }

  /**
   * Record block completion
   * 
   * BLOCK IDENTITY:
   * - blockId: Actual block identity (NOT blockType)
   * - blockVersion: Content version (e.g., "D1", "C1", "S1")
   * 
   * IDEMPOTENCY:
   * - Same user + navigationNode + blockId + blockVersion → no duplicate
   * 
   * DOES NOT:
   * - Automatically complete node (completion policy separate)
   * - Increment visit count
   * - Manufacture session
   * 
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   * HIERARCHY: Validates navigationNodeId belongs to subtopicId using authenticated brand
   * PROGRESS: Returns REAL calculated progress from canonical section content
   */
  async recordBlockCompletion(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string,
    sectionId: string | null,
    blockId: string,
    blockType: string,
    blockVersion: string,
    sessionId?: string
  ): Promise<NavigationProgressWithCalculatedDTO> {
    // Validate inputs
    validateUserId(identity.userId);
    validateNavigationNodeId(navigationNodeId);
    validateBlockId(blockId);
    validateBlockVersion(blockVersion);

    // Validate hierarchy using authenticated brand
    await this.validateNavigationHierarchy(
      navigationNodeId,
      subtopicId,
      sectionId,
      identity
    );

    // Ensure progress exists
    await this.getNavigationProgress(identity, navigationNodeId, subtopicId, sectionId);

    // Record completion
    const event: TutorialBlockCompletionEvent = {
      userId: identity.userId,
      navigationNodeId,
      sectionId,
      subtopicId,
      blockId,
      blockType,
      blockVersion,
      sessionId,
      occurredAt: new Date(),
    };

    const updated = await this.progressRepository.markBlockCompleted(event);

    // Resolve required blocks from canonical content
    const requiredBlocks = await this.resolveRequiredBlocks(
      subtopicId,
      navigationNodeId,
      identity
    );

    // Gate 3C.1R: Return without re-fetching block states for write operations
    return this.toDTO(updated, requiredBlocks, []);
  }

  /**
   * Record active time spent on navigation node
   * 
   * DOES NOT:
   * - Increment visit count
   * - Manufacture visit
   * - Update session state
   * 
   * TIME EVENT SEMANTICS (Phase 2.6-A3 Decision):
   * - CAN create progress record if none exists
   * - Result: visitCount=0, timeSpentActiveSec>0, status=not_started
   * - Rationale: Browser heartbeat tracking may occur before explicit visit
   * - Visit semantics remain separate (established by recordVisit only)
   * 
   * Accumulates time atomically at repository layer.
   * 
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   * PROGRESS: Returns REAL calculated progress from canonical section content
   */
  async recordActiveTime(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string,
    timeSpentSec: number
  ): Promise<NavigationProgressWithCalculatedDTO> {
    // Validate inputs
    validateUserId(identity.userId);
    validateNavigationNodeId(navigationNodeId);

    if (timeSpentSec < 0) {
      throw new InvalidTimeUpdateError('Time spent cannot be negative', {
        timeSpentSec,
      });
    }

    if (timeSpentSec > 3600) {
      throw new InvalidTimeUpdateError(
        'Time increment too large (max 1 hour per update)',
        { timeSpentSec, maxAllowed: 3600 }
      );
    }

    // Record time
    const event: TutorialTimeUpdateEvent = {
      userId: identity.userId,
      navigationNodeId,
      subtopicId,
      timeSpentActiveSec: timeSpentSec,
    };

    const updated = await this.progressRepository.recordTime(event);

    // Resolve required blocks from canonical content
    const requiredBlocks = await this.resolveRequiredBlocks(
      subtopicId,
      navigationNodeId,
      identity
    );

    // Gate 3C.1R: Return without re-fetching block states for write operations
    return this.toDTO(updated, requiredBlocks, []);
  }

  /**
   * Complete navigation node
   * 
   * COMPLETION POLICY:
   * - Service evaluates completion eligibility first
   * - Only marks complete if policy allows
   * - Idempotent: already-complete nodes remain complete
   * 
   * Phase 2.6-A3 POLICY (extensible in Phase 2.6-B):
   * - All required blocks must be completed
   * - Block identity: blockId + blockVersion
   * 
   * ZERO-REQUIRED-BLOCKS SEMANTIC (Phase 2.6-A3 Decision):
   * - Zero required blocks → canComplete=true (vacuously complete)
   * - Progress percentage → 100% (not 0%)
   * - Rationale: Content with no requirements is inherently complete
   * - Use case: Informational pages without interactive blocks
   * 
   * SECURITY: Server-side canonical requirement resolution.
   * - Client specifies WHICH node to complete
   * - Server determines WHAT blocks are required
   * - Canonical requirements resolved from tutorial_sections
   * 
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   */
  async completeNavigationNode(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string
  ): Promise<NavigationProgressWithCalculatedDTO> {
    // Validate inputs
    validateUserId(identity.userId);
    validateNavigationNodeId(navigationNodeId);
    validateSubtopicId(subtopicId);

    // Validate navigation hierarchy consistency
    await this.validateNavigationHierarchy(
      navigationNodeId,
      subtopicId,
      null, // sectionId optional
      identity
    );

    // Get current progress
    const progress = await this.progressRepository.getProgress(
      identity.userId,
      navigationNodeId
    );
    if (!progress) {
      throw new NavigationNodeNotFoundError(navigationNodeId);
    }

    // Resolve canonical requirements (server authority)
    const requiredBlocks = await this.resolveRequiredBlocks(
      subtopicId,
      navigationNodeId,
      identity
    );

    // Evaluate completion policy
    const decision = this.evaluateCompletionPolicy(progress, requiredBlocks);

    if (!decision.canComplete) {
      throw new LearningProgressError(
        `Cannot complete node: ${decision.reason}`,
        'COMPLETION_CRITERIA_NOT_MET',
        {
          navigationNodeId,
          completedBlocks: decision.completedRequiredBlockCount,
          requiredBlocks: decision.requiredBlockCount,
          reason: decision.reason,
        }
      );
    }

    // Mark complete (idempotent at repository)
    const updated = await this.progressRepository.completeNode(
      identity.userId,
      navigationNodeId
    );

    // Gate 3C.1R: Return without re-fetching block states for write operations
    return this.toDTO(updated, requiredBlocks, []);
  }

  /**
   * Calculate progress percentage
   * 
   * Delegates to pure aggregation function.
   * Kept as instance method for backward compatibility with existing tests.
   */
  calculateProgressPercentage(
    completedBlocks: CompletedBlockRecord[],
    requiredBlocks: Array<{ blockId: string; blockVersion: string }>
  ): number {
    return calculateProgressPercentageImpl(completedBlocks, requiredBlocks);
  }

  // ========================================================================
  // Phase 4.3: Block-Level Tracking Methods
  // ========================================================================

  /**
   * Record a learner visit to a specific block
   * 
   * VISIT SEMANTICS (Mirroring page-level):
   * - First visit: visitCount = 1, establishes firstViewedAt
   * - Same session: visitCount unchanged (service-level deduplication)
   * - New session: visitCount + 1
   * - New session + completed block: revisionCount + 1
   * 
   * SESSION CONTRACT:
   * - sessionId MUST be stable learning session identifier
   * - Same sessionId = same learning session (no visit increment)
   * - Different sessionId = new session (visit increment)
   * - Block-level sessionId tracking happens at SERVICE layer
   * - Repository provides atomic persistence only
   * 
   * BLOCK IDENTITY:
   * - (userId, navigationNodeId, blockId, blockVersion) - frozen 4-part identity
   * 
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   */
  /**
   * Record block visit - Phase 4.6 Atomic Session Tracking
   * 
   * Records a learner's visit to a specific block within a navigation context.
   * 
   * Phase 4.6 Architecture:
   * - Single atomic repository upsert (no SELECT before write)
   * - Database determines session transition via SQL CASE
   * - Visit/revision increments handled atomically in PostgreSQL
   * - Passes sessionId to repository for atomic comparison
   * 
   * @param identity - Authenticated learner identity
   * @param navigationNodeId - Navigation context (sidebar node)
   * @param subtopicId - Content identifier for hierarchy validation
   * @param blockId - Block instance UUID
   * @param blockVersion - Block content version (D1, C1, S1, etc.)
   * @param sessionId - Session identity for atomic visit tracking
   */
  async recordBlockVisit(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string,
    blockId: string,
    blockVersion: string,
    sessionId: string
  ): Promise<BlockLearningState> {
    // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Function entry (Phase 4.6)', {
    //   userId: identity.userId,
    //   brand: identity.brand,
    //   navigationNodeId,
    //   blockId,
    //   blockVersion,
    //   sessionId,
    //   subtopicId,
    //   timestamp: new Date().toISOString()
    // });
    
    // Validate inputs
    // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Validating inputs');
    validateUserId(identity.userId);
    validateNavigationNodeId(navigationNodeId);
    validateBlockId(blockId);
    validateBlockVersion(blockVersion);
    validateSessionId(sessionId);
    validateSubtopicId(subtopicId);
    // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Input validation passed');

    // Validate navigation hierarchy
    // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Validating navigation hierarchy');
    try {
      await this.validateNavigationHierarchy(
        navigationNodeId,
        subtopicId,
        null,
        identity
      );
      // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Hierarchy validation passed');
    } catch (error) {
      // console.error('[ILS-DEBUG][SERVICE][recordBlockVisit][ERROR] Hierarchy validation failed:', error);
      throw error;
    }

    // Phase 4.5: Fetch tutorial content to extract expectedTimeSec
    // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Fetching tutorial content', {
    //   subtopicId,
    //   navigationNodeId,
    //   brand: identity.brand
    // });
    
    const section = await this.sectionRepository.getTutorialByPageIdentity(
      subtopicId,
      navigationNodeId,
      identity.brand
    );

    // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Tutorial content fetched', {
    //   hasSectionFound: !!section,
    //   hasContent: !!section?.content,
    //   hasBlocks: !!section?.content?.blocks,
    //   blocksCount: section?.content?.blocks?.length || 0
    // });

    // Extract expectedTimeSec from block envelope
    let expectedTimeSec: number | null = null;
    if (section?.content?.blocks) {
      const block = section.content.blocks.find(
        (b: any) => b.id === blockId && b.version === blockVersion
      );
      expectedTimeSec = block?.expectedTimeSec ?? null;
      
      // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Block lookup in content', {
      //   requestedBlockId: blockId,
      //   requestedBlockVersion: blockVersion,
      //   blockFound: !!block,
      //   extractedExpectedTimeSec: expectedTimeSec
      // });
    } else {
      // console.warn('[ILS-DEBUG][SERVICE][recordBlockVisit][WARN] No blocks found in section content');
    }

    const now = new Date();

    // Phase 4.6: Single atomic upsert - repository handles all visit/revision logic
    // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit] Executing atomic upsert (Phase 4.6)');
    const result = await this.blockLearningStateRepository.upsert({
      userId: identity.userId,
      navigationNodeId,
      blockId,
      blockVersion,
      lastSessionId: sessionId,  // Phase 4.6: Database compares for session transition
      expectedTimeSec,
      lastViewedAt: now,
    });
    
    // console.log('[ILS-DEBUG][SERVICE][recordBlockVisit][SUCCESS] Atomic upsert completed', {
    //   id: result.id,
    //   visitCount: result.visitCount,
    //   revisionCount: result.revisionCount,
    //   lastSessionId: result.lastSessionId
    // });
    
    return result;
  }

  /**
   * Record active time spent on a specific block
   * 
   * TIME SEMANTICS:
   * - Accumulates time atomically at repository layer
   * - Does NOT increment visit count
   * - Does NOT change session state
   * - Block-level time limit: 600 seconds (stricter than page-level 3600s)
   * 
   * DOES NOT:
   * - Manufacture visits (visits require explicit recordBlockVisit)
   * - Update session state
   * - Modify completion state
   * 
   * CAN CREATE:
   * - Progress record if none exists (activeTimeSec>0, visitCount=0)
   * - Rationale: Browser heartbeat may occur before explicit visit
   * 
   * BLOCK IDENTITY:
   * - (userId, navigationNodeId, blockId, blockVersion) - frozen 4-part identity
   * 
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   */
  /**
   * Phase D-2: Record block active time (idempotent)
   * 
   * CRITICAL TRANSACTION DESIGN:
   * - Claim event atomically with ON CONFLICT DO NOTHING
   * - If new event: accumulate active time
   * - If duplicate: validate payload immutability, do NOT accumulate again
   * - Event claim + time accumulation commit or rollback together
   * 
   * @param eventId - Client-generated UUID for idempotency
   * @returns Object with state and processing metadata
   */
  async recordBlockActiveTime(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string,
    blockId: string,
    blockVersion: string,
    eventId: string,
    activeTimeSec: number
  ): Promise<{ state: BlockLearningState; wasProcessed: boolean; wasAlreadyProcessed: boolean }> {
    // Validate inputs
    validateUserId(identity.userId);
    validateNavigationNodeId(navigationNodeId);
    validateBlockId(blockId);
    validateBlockVersion(blockVersion);
    validateSubtopicId(subtopicId);
    validateEventId(eventId);

    // Block-level time validation (stricter than page-level)
    if (activeTimeSec < 0) {
      throw new InvalidTimeUpdateError('Active time cannot be negative', {
        activeTimeSec,
      });
    }

    if (activeTimeSec > 600) {
      throw new InvalidTimeUpdateError(
        'Block time increment too large (max 600 seconds per update)',
        { activeTimeSec, maxAllowed: 600 }
      );
    }

    // Validate navigation hierarchy
    await this.validateNavigationHierarchy(
      navigationNodeId,
      subtopicId,
      null,
      identity
    );

    const now = new Date();

    // ATOMIC TRANSACTION: Event claim + active time accumulation
    // Use the actual db instance which has .transaction() method
    return await db.transaction(async (tx) => {
      // Use transaction-scoped repositories
      const txBlockTelemetryRepo = this.blockTelemetryEventRepository.withDb(tx as never);
      const txBlockStateRepo = this.blockLearningStateRepository.withDb(tx as never);

      // Attempt to claim event atomically
      const claimedEvent = await txBlockTelemetryRepo.claimEvent({
        eventId,
        userId: identity.userId,
        navigationNodeId,
        blockId,
        blockVersion,
        activeTimeSec,
      });

      if (claimedEvent) {
        // NEW EVENT: Accumulate active time
        const updatedState = await txBlockStateRepo.upsert({
          userId: identity.userId,
          navigationNodeId,
          blockId,
          blockVersion,
          activeTimeSec,
          lastViewedAt: now,
        });

        // Return with metadata indicating new processing
        return { state: updatedState, wasProcessed: true, wasAlreadyProcessed: false };
      } else {
        // DUPLICATE EVENT: Validate payload immutability
        const existingEvent = await txBlockTelemetryRepo.findByEventId(eventId);

        if (!existingEvent) {
          // Should never happen (claimEvent returned null but event doesn't exist)
          throw new LearningProgressError(
            'Event claim failed but event not found',
            'EVENT_CLAIM_INCONSISTENCY',
            { eventId }
          );
        }

        // Validate immutable payload
        if (
          existingEvent.userId !== identity.userId ||
          existingEvent.navigationNodeId !== navigationNodeId ||
          existingEvent.blockId !== blockId ||
          existingEvent.blockVersion !== blockVersion ||
          existingEvent.activeTimeSec !== activeTimeSec
        ) {
          throw new LearningProgressError(
            'Event payload conflict - same eventId with different payload',
            'EVENT_PAYLOAD_CONFLICT',
            {
              eventId,
              existing: {
                userId: existingEvent.userId,
                navigationNodeId: existingEvent.navigationNodeId,
                blockId: existingEvent.blockId,
                blockVersion: existingEvent.blockVersion,
                activeTimeSec: existingEvent.activeTimeSec,
              },
              requested: {
                userId: identity.userId,
                navigationNodeId,
                blockId,
                blockVersion,
                activeTimeSec,
              },
            }
          );
        }

        // IDEMPOTENT SUCCESS: Return current learning state (do NOT accumulate again)
        // 
        // D2-9 CRITICAL: Event ledger is authoritative for idempotency.
        // Even if block_learning_state is soft-deleted/absent, the duplicate
        // event must NOT be reprocessed.
        const currentState = await txBlockStateRepo.findOne({
          userId: identity.userId,
          navigationNodeId,
          blockId,
          blockVersion,
        });

        if (!currentState) {
          // Event exists but state is currently absent (soft-deleted or not yet created).
          // The event ledger is authoritative: this is a duplicate and must NOT be reprocessed.
          // 
          // Return minimal stub state to satisfy API contract while preserving idempotency.
          // DO NOT create/restore state merely to make duplicate pass.
          // DO NOT reapply the active-time delta.
          const stubState: BlockLearningState = {
            id: '', // Not persisted
            userId: identity.userId,
            navigationNodeId,
            blockId,
            blockVersion,
            visitCount: 0,
            revisionCount: 0,
            activeTimeSec: 0, // Cannot determine true value without state
            lastSessionId: null,
            firstViewedAt: null,
            lastViewedAt: null,
            completedAt: null,
            expectedTimeSec: null,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          };

          return { state: stubState, wasProcessed: false, wasAlreadyProcessed: true };
        }

        // Return with metadata indicating duplicate
        return { state: currentState, wasProcessed: false, wasAlreadyProcessed: true };
      }
    });
  }

  /**
   * Calculate block time comparison metrics
   * 
   * PURE CALCULATION - no database access, no side effects
   * 
   * Compares actual time spent vs expected time for a block.
   * Returns null-safe metrics for time efficiency analysis.
   * 
   * NO BUSINESS LOGIC:
   * - Does not determine "struggling" vs "efficient"
   * - Does not apply thresholds
   * - Does not make educational decisions
   * - Just returns raw comparison data
   * 
   * EXPECTED TIME SOURCE:
   * - Must come from published tutorial document
   * - Service does NOT calculate or invent this value
   * - Future phase will resolve from canonical content
   * 
   * NULL SEMANTICS:
   * - expectedTimeSec = null → ratio = null (no comparison possible)
   * - activeTimeSec = 0 → ratio = 0 (no time spent yet)
   * 
   * @param blockState - Block learning state from repository
   * @returns Time comparison metrics (null-safe)
   */
  calculateBlockTimeComparison(blockState: BlockLearningState): {
    actualTimeSec: number;
    expectedTimeSec: number | null;
    differenceTimeSec: number | null;
    ratioActualToExpected: number | null;
  } {
    const actualTimeSec = blockState.activeTimeSec;
    const expectedTimeSec = blockState.expectedTimeSec;

    // Null-safe calculations
    if (expectedTimeSec === null) {
      return {
        actualTimeSec,
        expectedTimeSec: null,
        differenceTimeSec: null,
        ratioActualToExpected: null,
      };
    }

    const differenceTimeSec = actualTimeSec - expectedTimeSec;
    const ratioActualToExpected = expectedTimeSec > 0 ? actualTimeSec / expectedTimeSec : 0;

    return {
      actualTimeSec,
      expectedTimeSec,
      differenceTimeSec,
      ratioActualToExpected,
    };
  }

  /**
   * Evaluate completion policy
   * 
   * Phase 2.6-A3: Simple required-blocks policy
   * Phase 2.6-B: Can extend with time requirements, practice requirements, etc.
   * 
   * ZERO-REQUIRED-BLOCKS SEMANTIC:
   * - No required blocks → canComplete=true (vacuously complete)
   * - Consistent with 100% progress for zero requirements
   * - Use case: Informational content without interactive blocks
   */
  private evaluateCompletionPolicy(
    progress: TutorialNavigationProgressRecord,
    requiredBlocks: Array<{ blockId: string; blockVersion: string }>
  ): CompletionDecision {
    // Zero required blocks = vacuously complete
    if (requiredBlocks.length === 0) {
      return {
        canComplete: true,
        reason: 'No required blocks - vacuously complete',
        completedRequiredBlockCount: 0,
        requiredBlockCount: 0,
      };
    }

    const completedRequiredBlocks = requiredBlocks.filter((required) =>
      progress.completedBlocks.some(
        (completed) =>
          completed.blockId === required.blockId &&
          completed.blockVersion === required.blockVersion
      )
    );

    const completedCount = completedRequiredBlocks.length;
    const requiredCount = requiredBlocks.length;

    if (completedCount < requiredCount) {
      return {
        canComplete: false,
        reason: `Missing ${requiredCount - completedCount} required blocks`,
        completedRequiredBlockCount: completedCount,
        requiredBlockCount: requiredCount,
      };
    }

    return {
      canComplete: true,
      reason: 'All required blocks completed',
      completedRequiredBlockCount: completedCount,
      requiredBlockCount: requiredCount,
    };
  }

  /**
   * Determine semantic learning state
   * 
   * Delegates to pure aggregation function.
   * Kept as instance method for backward compatibility with existing tests.
   */
  determineLearningState(
    status: 'not_started' | 'in_progress' | 'completed'
  ): LearningState {
    return determineLearningStateImpl(status);
  }

  /**
   * Aggregate parent learning state from children
   * 
   * Delegates to pure aggregation function.
   * Kept as instance method for backward compatibility with existing tests.
   */
  aggregateParentState(childStates: LearningState[]): LearningState {
    return aggregateParentStateImpl(childStates);
  }

  /**
   * Convert repository record to DTO with calculated progress
   * 
   * Gate 3C.1R: Now includes per-block telemetry state
   * 
   * @param record - Progress record from repository
   * @param requiredBlocks - Required blocks for progress calculation
   * @param blockStates - Per-block telemetry from block_learning_state table
   * @returns DTO with required blocks context and per-block metrics
   */
  private toDTO(
    record: TutorialNavigationProgressRecord,
    requiredBlocks: Array<{ blockId: string; blockVersion: string }>,
    blockStates: BlockLearningState[]
  ): NavigationProgressWithCalculatedDTO {
    const progressPercentage = this.calculateProgressPercentage(
      record.completedBlocks,
      requiredBlocks
    );

    // Map block states to DTO format
    const blocks: BlockLearningStateDTO[] = blockStates.map((state) => ({
      blockId: state.blockId,
      blockVersion: state.blockVersion,
      visitCount: state.visitCount,
      revisionCount: state.revisionCount,
      activeTimeSec: state.activeTimeSec,
      expectedTimeSec: state.expectedTimeSec, // Nullable - content-authored value
      firstViewedAt: state.firstViewedAt,
      lastViewedAt: state.lastViewedAt,
      completedAt: state.completedAt,
    }));

    return {
      navigationNodeId: record.navigationNodeId,
      sectionId: record.sectionId,
      subtopicId: record.subtopicId,
      status: this.determineLearningState(record.status),
      progressPercentage,
      completedBlocks: record.completedBlocks,
      completedBlockCount: record.completedBlocks.length,
      totalBlockCount: requiredBlocks.length,
      requiredBlocks, // Include canonical requirements in DTO
      blocks, // Gate 3C.1R: Per-block telemetry metrics
      timeSpentActiveSec: record.timeSpentActiveSec,
      visitCount: record.visitCount,
      revisionCount: record.revisionCount,
      firstViewedAt: record.firstViewedAt,
      lastViewedAt: record.lastViewedAt,
      completedAt: record.completedAt,
    };
  }

  /**
   * Resolve required blocks from canonical section content
   * 
   * Delegates to hierarchy resolution module.
   */
  private async resolveRequiredBlocks(
    subtopicId: string,
    navigationNodeId: string,
    identity: AuthenticatedIdentity
  ): Promise<Array<{ blockId: string; blockVersion: string }>> {
    return resolveRequiredBlocksImpl(
      this.sectionRepository,
      subtopicId,
      navigationNodeId,
      identity
    );
  }

  /**
   * Validate navigation hierarchy consistency
   * 
   * Delegates to hierarchy resolution module.
   */
  private async validateNavigationHierarchy(
    navigationNodeId: string,
    subtopicId: string,
    sectionId: string | null | undefined,
    identity: AuthenticatedIdentity
  ): Promise<void> {
    return validateNavigationHierarchyImpl(
      this.sectionRepository,
      navigationNodeId,
      subtopicId,
      sectionId,
      identity
    );
  }
}
