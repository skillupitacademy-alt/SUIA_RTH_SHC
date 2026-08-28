/**
 * Phase 2.6-A3: Learning Progress Types
 * 
 * Type definitions, interfaces, and error classes for learning progress tracking.
 * Extracted from learning-progress.service.ts for better modularity.
 */

import type { CompletedBlockRecord } from '@quiz/types';

/**
 * Learning state semantic values
 * 
 * These are domain states, NOT UI colors.
 * Frontend maps these to visual representations.
 */
export type LearningState = 
  | 'not_started'   // No meaningful interaction yet
  | 'in_progress'   // Actively learning
  | 'completed'     // All required criteria met
  | 'not_available';// Content unavailable to learner

/**
 * Authenticated Identity Context
 * 
 * Represents verified user identity from authentication layer (JWT/session).
 * Service operations are SELF-SCOPED - the authenticated identity IS the target user.
 * 
 * AUTHORIZATION BOUNDARY:
 * - userId: MUST be from trusted authentication (JWT/session)
 * - brand: MUST be from trusted authentication (determines content access scope)
 * - sessionId: Optional stable session identifier for visit tracking
 * 
 * CRITICAL: Learner-facing operations MUST NOT accept arbitrary target userId.
 * The authenticated identity is the ONLY source of userId for progress operations.
 */
export interface AuthenticatedIdentity {
  userId: string;
  brand: string; // Required - authenticated brand scope
  sessionId?: string; // Optional - for visit tracking
}

/**
 * Navigation Progress DTO
 * 
 * Domain transfer object returned to service consumers.
 * Does not expose internal database fields unnecessarily.
 */
export interface NavigationProgressDTO {
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId: string;
  status: LearningState;
  progressPercentage: number; // 0-100
  completedBlocks: CompletedBlockRecord[];
  completedBlockCount: number;
  totalBlockCount: number; // Requires service to know section's block count
  timeSpentActiveSec: number;
  visitCount: number;
  revisionCount: number;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Navigation Progress DTO with calculated progress
 * 
 * Extended DTO that includes calculated progress percentage based on required blocks.
 * Used when required blocks context is available.
 */
export interface NavigationProgressWithCalculatedDTO extends NavigationProgressDTO {
  requiredBlocks: Array<{ blockId: string; blockVersion: string }>;
}

/**
 * Completion Policy Decision
 * 
 * Result of evaluating whether a navigation node can be marked complete.
 */
export interface CompletionDecision {
  canComplete: boolean;
  reason: string;
  completedRequiredBlockCount: number;
  requiredBlockCount: number;
}

/**
 * Service errors
 */
export class LearningProgressError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LearningProgressError';
  }
}

export class NavigationNodeNotFoundError extends LearningProgressError {
  constructor(navigationNodeId: string) {
    super(
      `Navigation node not found: ${navigationNodeId}`,
      'NAVIGATION_NODE_NOT_FOUND',
      { navigationNodeId }
    );
  }
}

export class UnauthorizedProgressAccessError extends LearningProgressError {
  constructor(userId: string, navigationNodeId: string) {
    super(
      'Learner cannot access this progress',
      'UNAUTHORIZED_PROGRESS_ACCESS',
      { userId, navigationNodeId }
    );
  }
}

export class InvalidBlockCompletionError extends LearningProgressError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INVALID_BLOCK_COMPLETION', context);
  }
}

export class InvalidNavigationHierarchyError extends LearningProgressError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INVALID_NAVIGATION_HIERARCHY', context);
  }
}

export class InvalidTimeUpdateError extends LearningProgressError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INVALID_TIME_UPDATE', context);
  }
}
