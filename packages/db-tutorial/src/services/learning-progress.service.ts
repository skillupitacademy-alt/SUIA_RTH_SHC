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
import {
  type LearningState,
  type AuthenticatedIdentity,
  type NavigationProgressDTO,
  type NavigationProgressWithCalculatedDTO,
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
    private readonly sectionRepository: TutorialSectionRepository
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
  ): Promise<NavigationProgressDTO> {
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

    return this.toDTO(progress, requiredBlocks);
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
  ): Promise<NavigationProgressDTO[]> {
    validateUserId(identity.userId);

    const progressRecords = await this.progressRepository.getProgressForSubtopic(
      identity.userId,
      subtopicId
    );

    // Resolve required blocks for each navigation node
    const results: NavigationProgressDTO[] = [];
    for (const record of progressRecords) {
      const requiredBlocks = await this.resolveRequiredBlocks(
        record.subtopicId,
        record.navigationNodeId,
        identity
      );
      results.push(this.toDTO(record, requiredBlocks));
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
  ): Promise<NavigationProgressDTO> {
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

    return this.toDTO(updated, requiredBlocks);
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
  ): Promise<NavigationProgressDTO> {
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

    return this.toDTO(updated, requiredBlocks);
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
  ): Promise<NavigationProgressDTO> {
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

    return this.toDTO(updated, requiredBlocks);
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
   * AUTHORIZATION: SELF-SCOPED - uses authenticated identity.userId ONLY
   */
  async completeNavigationNode(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    requiredBlocks: Array<{ blockId: string; blockVersion: string }>
  ): Promise<NavigationProgressDTO> {
    // Validate inputs
    validateUserId(identity.userId);
    validateNavigationNodeId(navigationNodeId);

    // Get current progress
    const progress = await this.progressRepository.getProgress(
      identity.userId,
      navigationNodeId
    );
    if (!progress) {
      throw new NavigationNodeNotFoundError(navigationNodeId);
    }

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

    return this.toDTO(updated, requiredBlocks);
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
   * Convert repository record to DTO
   * 
   * @param record - Progress record from repository
   * @param requiredBlocks - Required blocks for progress calculation (empty array if not available)
   */
  private toDTO(
    record: TutorialNavigationProgressRecord,
    requiredBlocks: Array<{ blockId: string; blockVersion: string }>
  ): NavigationProgressDTO {
    const progressPercentage = this.calculateProgressPercentage(
      record.completedBlocks,
      requiredBlocks
    );

    return {
      navigationNodeId: record.navigationNodeId,
      sectionId: record.sectionId,
      subtopicId: record.subtopicId,
      status: this.determineLearningState(record.status),
      progressPercentage,
      completedBlocks: record.completedBlocks,
      completedBlockCount: record.completedBlocks.length,
      totalBlockCount: requiredBlocks.length,
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
