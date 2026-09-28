/**
 * Instructional Block Completion Orchestrator - Phase 2B.18
 * 
 * PURPOSE:
 * Orchestrates automatic block completion based on active time threshold.
 * 
 * ARCHITECTURE:
 * ```
 * ILSProvider (telemetry data)
 *       ↓
 * InstructionalBlockCompletionOrchestrator (this component)
 *       ↓
 * evaluateInstructionalBlockCompletion (pure function)
 *       ↓
 * tutorialTrackingService.markBlockComplete() (existing pipeline)
 *       ↓
 * POST /api/tutorial/ils/block-completion (existing API)
 *       ↓
 * LearningProgressService.recordBlockCompletion() (existing service)
 *       ↓
 * TutorialNavigationProgressRepository.markBlockCompleted() (existing repo)
 *       ↓
 * tutorial_navigation_progress.completed_blocks[] (existing storage)
 *       ↓
 * BlockLearningStateRepository revision lifecycle (existing 0→1 logic)
 * ```
 * 
 * RESPONSIBILITIES:
 * - Monitor activeBlockProgress from ILSProvider
 * - Evaluate completion using evaluateInstructionalBlockCompletion()
 * - Trigger completion via tutorialTrackingService.markBlockComplete()
 * - Track completion attempts (prevent duplicate triggers)
 * 
 * NOT RESPONSIBILITIES:
 * - Time tracking (BlockTelemetryProvider)
 * - Completion persistence (tutorialTrackingService → ILS API → backend)
 * - Revision counting (BlockLearningStateRepository atomic SQL)
 * - Block metadata resolution (TutorialDocument)
 * 
 * FAILURE ISOLATION:
 * - Completion failures MUST NOT break learner UX
 * - Silent failure with console logging
 * - Manual completion fallback remains available
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useILS, type ILSActiveBlockProgress } from './ILSProvider';
import {
  evaluateInstructionalBlockCompletion,
  type InstructionalBlockMetadata,
  type BlockTelemetryData,
  type CompletionEvaluation,
} from './instructionalBlockCompletion';
// Note: Cross-package import from workspace root src/
// From packages/ui/src/tutorial/runtime/ go up to workspace root, then to src/
import { markBlockComplete } from '../../../../../src/share-branding/LearningExperience/runtime/tutorialTrackingService';

export interface InstructionalBlockCompletionOrchestratorProps {
  /**
   * Navigation node ID (from URL/hierarchy)
   */
  navigationNodeId: string;
  
  /**
   * Subtopic ID (UUID from hierarchy)
   */
  subtopicId: string;
  
  /**
   * Section ID (optional, may be null during progressive publishing)
   */
  sectionId: string | null;
  
  /**
   * Block metadata resolver
   * Returns progressRole and expectedTimeSec for a given block identity
   * 
   * Source: Published TutorialDocument blocks[]
   */
  resolveBlockMetadata: (
    blockId: string,
    blockVersion: string
  ) => Pick<InstructionalBlockMetadata, 'progressRole' | 'expectedTimeSec'> | null;
  
  /**
   * Enable/disable automatic completion (default: true)
   * Useful for testing or gradual rollout
   */
  enabled?: boolean;
  
  /**
   * Children to render
   */
  children: React.ReactNode;
}

/**
 * Completion attempt tracking
 * Prevents duplicate completion triggers for the same block
 * 
 * CLIENT ATTEMPT IDENTITY: navigationNodeId + blockId + blockVersion
 * - Three-component key for runtime deduplication
 * - Scoped to component lifecycle (useRef)
 * - Does NOT include userId (single mount = single authenticated user)
 * - Cleared on component unmount/navigation
 * 
 * BACKEND CANONICAL IDENTITY: (userId, navigationNodeId, blockId, blockVersion)
 * - Four-component identity in repository
 * - Database UNIQUE constraint includes userId
 * - This client key is NOT equivalent to backend identity
 * - Backend idempotency is the ultimate protection
 */
interface CompletionAttempt {
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  attemptedAt: number; // performance.now() timestamp
  succeeded: boolean;
}

/**
 * Instructional Block Completion Orchestrator
 * 
 * Renders children and orchestrates automatic completion in the background.
 * Does NOT render any UI of its own.
 */
export function InstructionalBlockCompletionOrchestrator({
  navigationNodeId,
  subtopicId,
  sectionId,
  resolveBlockMetadata,
  enabled = true,
  children,
}: InstructionalBlockCompletionOrchestratorProps) {
  const { activeBlockProgress } = useILS();
  
  // Track completion attempts to prevent duplicates
  const completionAttemptsRef = useRef<Map<string, CompletionAttempt>>(new Map());
  
  // Track in-flight completions (synchronous ownership claim)
  // CORRECTION Phase 2B.18.1: Add synchronous in-flight tracking to prevent
  // concurrent evaluations from both triggering completion for the same block.
  // This addresses both:
  // - Defect D: Duplicate success POSTs from sequential evaluations
  // - Defect F: Concurrent completion requests while first is pending
  const inFlightAttemptsRef = useRef<Set<string>>(new Set());
  
  /**
   * Check if block has already been completed (or completion attempted)
   * 
   * CORRECTION (Phase 2B.18.1): Include navigationNodeId in deduplication key
   * - Prevents cross-page suppression when same block appears on different pages
   * - Three-component key is sufficient for component-lifecycle deduplication
   */
  const hasCompletionAttempt = useCallback(
    (blockId: string, blockVersion: string): boolean => {
      // CRITICAL: Include navigationNodeId to prevent cross-page suppression
      const key = `${navigationNodeId}:${blockId}:${blockVersion}`;
      const attempt = completionAttemptsRef.current.get(key);
      
      if (!attempt) return false;
      
      // If previous attempt succeeded, don't retry
      if (attempt.succeeded) return true;
      
      // If previous attempt failed, allow retry
      // Rationale: Backend idempotency protects duplicates but not lost delivery
      // Network/transient failures should not permanently lose completion
      // Component remount naturally clears attempts and allows fresh evaluation
      return false;
    },
    [navigationNodeId]
  );
  
  /**
   * Record completion attempt
   */
  const recordCompletionAttempt = useCallback(
    (blockId: string, blockVersion: string, succeeded: boolean): void => {
      // CRITICAL: Include navigationNodeId to prevent cross-page suppression
      const key = `${navigationNodeId}:${blockId}:${blockVersion}`;
      completionAttemptsRef.current.set(key, {
        navigationNodeId,
        blockId,
        blockVersion,
        attemptedAt: performance.now(),
        succeeded,
      });
    },
    [navigationNodeId]
  );
  
  /**
   * Trigger completion via existing pipeline
   * 
   * STEP 1.2 CORRECTION:
   * Now observes explicit delivery result from tracking service.
   * Records succeeded=true only when completion is actually delivered.
   * Failed deliveries (network, HTTP error) are recorded as succeeded=false,
   * making them retryable on next evaluation.
   */
  const triggerCompletion = useCallback(
    async (
      blockId: string,
      blockType: string,
      blockVersion: string,
      evaluation: CompletionEvaluation
    ): Promise<void> => {
      console.log('[InstructionalBlockCompletion] Triggering automatic completion', {
        blockId,
        blockType,
        blockVersion,
        evaluation,
        navigationNodeId,
        subtopicId,
        sectionId,
      });
      
      // Call existing completion pipeline
      // This triggers: tutorialTrackingService → ILS API → LearningProgressService → Repository
      // 
      // AUTHENTICATION: learnerId parameter is legacy (not sent to API)
      // - Authentication happens via cookies (credentials: 'include')
      // - API derives userId from validated request context
      // 
      // SESSION TRACKING: Completion does NOT update lastSessionId
      // - Session tracking happens via visit flow only
      // - Revision detection uses visit-based session transitions
      // - BlockLearningStateRepository has atomic revision SQL
      // 
      // DELIVERY RESULT: markBlockComplete() now returns explicit result
      // - delivered: true → completion reached backend successfully
      // - delivered: false → network/HTTP failure, retryable
      const result = await markBlockComplete(
        '', // learnerId placeholder (API ignores, derives from auth)
        subtopicId,
        navigationNodeId,
        sectionId,
        blockId,
        blockType,
        blockVersion
      );
      
      if (result.delivered) {
        console.log('[InstructionalBlockCompletion] Automatic completion succeeded', {
          blockId,
          blockVersion,
        });
        
        recordCompletionAttempt(blockId, blockVersion, true);
      } else {
        // Delivery failed - log but allow retry
        console.warn('[InstructionalBlockCompletion] Automatic completion delivery failed', {
          blockId,
          blockVersion,
          reason: result.reason,
        });
        
        recordCompletionAttempt(blockId, blockVersion, false);
      }
    },
    [navigationNodeId, subtopicId, sectionId, recordCompletionAttempt]
  );
  
  /**
   * Evaluate and trigger completion if threshold met
   */
  const evaluateAndTrigger = useCallback(
    async (blockProgress: ILSActiveBlockProgress): Promise<void> => {
      if (!enabled) return;
      
      const { blockId, blockType, blockVersion, isCompleted } = blockProgress;
      
      // Skip if already completed
      if (isCompleted) {
        return;
      }
      
      // CORRECTION Phase 2B.18.1: Check in-flight FIRST (before hasCompletionAttempt)
      // This prevents concurrent evaluations from both entering the completion flow.
      // Key must include navigationNodeId to preserve cross-page independence.
      const key = `${navigationNodeId}:${blockId}:${blockVersion}`;
      
      if (inFlightAttemptsRef.current.has(key)) {
        // Another evaluation is already processing this block
        return;
      }
      
      // Skip if completion already attempted (and succeeded)
      if (hasCompletionAttempt(blockId, blockVersion)) {
        return;
      }
      
      // Resolve block metadata (progressRole + expectedTimeSec)
      const metadataFragment = resolveBlockMetadata(blockId, blockVersion);
      
      if (!metadataFragment) {
        console.warn('[InstructionalBlockCompletion] Could not resolve block metadata', {
          blockId,
          blockVersion,
        });
        return;
      }
      
      // Construct metadata for evaluator
      const metadata: InstructionalBlockMetadata = {
        blockId,
        blockVersion,
        progressRole: metadataFragment.progressRole,
        expectedTimeSec: metadataFragment.expectedTimeSec,
      };
      
      // Construct telemetry data for evaluator
      const telemetry: BlockTelemetryData = {
        blockId,
        blockVersion,
        activeTimeSec: blockProgress.activeTimeSec,
      };
      
      // GATE F FORENSIC: Log input values (diagnostic only - no behavior change)
      console.log('[GATE F FORENSIC] Evaluation inputs:', {
        blockId,
        blockVersion,
        'blockProgress.isCompleted': blockProgress.isCompleted,
        'blockProgress.activeTimeSec': blockProgress.activeTimeSec,
        'metadata.progressRole': metadata.progressRole,
        'metadata.expectedTimeSec': metadata.expectedTimeSec,
      });
      
      // Evaluate completion
      let evaluation: CompletionEvaluation;
      try {
        evaluation = evaluateInstructionalBlockCompletion(metadata, telemetry);
      } catch (error) {
        console.error('[InstructionalBlockCompletion] Evaluation failed', {
          blockId,
          blockVersion,
          error,
        });
        return;
      }
      
      console.log('[InstructionalBlockCompletion] Evaluation result', {
        blockId,
        blockVersion,
        evaluation,
      });
      
      // GATE F FORENSIC: Expanded values (diagnostic only - no behavior change)
      console.log('[GATE F FORENSIC] Evaluation details:', {
        blockId,
        blockVersion,
        'evaluation.shouldComplete': evaluation.shouldComplete,
        'evaluation.reason': evaluation.reason,
        'evaluation.completionRatio': evaluation.completionRatio,
        'evaluation.thresholdRatio': evaluation.thresholdRatio,
      });
      
      // Trigger completion if threshold met
      if (evaluation.shouldComplete) {
        // Claim synchronous in-flight ownership
        inFlightAttemptsRef.current.add(key);
        
        try {
          // Trigger completion
          await triggerCompletion(
            blockId,
            blockType,
            blockVersion,
            evaluation
          );
        } finally {
          // Release ownership regardless of success/failure
          inFlightAttemptsRef.current.delete(key);
        }
      }
    },
    [enabled, navigationNodeId, resolveBlockMetadata, hasCompletionAttempt, triggerCompletion]
  );
  
  /**
   * Monitor activeBlockProgress and trigger evaluation
   */
  useEffect(() => {
    // DIAGNOSTIC: Log every time this effect runs
    console.log('[InstructionalBlockCompletion] useEffect triggered', {
      enabled,
      hasActiveBlockProgress: !!activeBlockProgress,
      activeBlockProgress: activeBlockProgress ? {
        blockId: activeBlockProgress.blockId,
        blockVersion: activeBlockProgress.blockVersion,
        isCompleted: activeBlockProgress.isCompleted,
        activeTimeSec: activeBlockProgress.activeTimeSec,
      } : null,
    });
    
    if (!enabled || !activeBlockProgress) return;
    
    // Evaluate current active block
    void evaluateAndTrigger(activeBlockProgress);
  }, [enabled, activeBlockProgress, evaluateAndTrigger]);
  
  return <>{children}</>;
}
