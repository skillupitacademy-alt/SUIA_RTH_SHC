/**
 * Block Telemetry Provider - Phase 4.5
 * 
 * PURPOSE:
 * Orchestrates automatic block-level telemetry emission based on viewport
 * tracking from ActiveBlockContext.
 * 
 * ARCHITECTURE:
 * - Consumes activeBlock from ActiveBlockContext (viewport tracking)
 * - Emits visit events when blocks become active
 * - Tracks active engagement time with heartbeat flush
 * - Handles visibility changes (pause/resume)
 * - Flushes pending time on block changes and unmount
 * 
 * SEPARATION OF CONCERNS:
 * - ActiveBlockContext: Viewport-based block detection (no side effects)
 * - ILSProvider: Data context layer (read-only, no telemetry emission)
 * - BlockTelemetryProvider: Telemetry orchestration (side effects only, no context export)
 * 
 * CRITICAL CONSTRAINTS:
 * - activeTimeSec is an INCREMENT (delta), not cumulative
 * - Timing based on actual elapsed duration (performance.now()), not heartbeat ticks
 * - Flushes are serialized to prevent double-counting
 * - Telemetry failures MUST NOT break learner UX
 * - Hidden time is NOT counted as active time
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useActiveBlock, type ActiveBlockIdentity } from './ActiveBlockContext';

export interface BlockTelemetryProviderProps {
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
   * Tutorial learning session ID (from tutorialSessionService)
   * If null, telemetry will be disabled
   */
  sessionId: string | null;
  
  /**
   * Children to render
   */
  children: React.ReactNode;
  
  /**
   * Heartbeat interval in milliseconds (default: 30000 = 30 seconds)
   */
  heartbeatIntervalMs?: number;
  
  /**
   * Enable/disable telemetry (default: true)
   */
  enabled?: boolean;
}

/**
 * Internal timing state
 */
interface TimingState {
  blockId: string;
  blockVersion: string;
  startTime: number; // performance.now() when timing started
  accumulatedMs: number; // accumulated time when paused or between flushes
  isPaused: boolean;
}

/**
 * Request identity for race condition prevention
 */
interface RequestIdentity {
  blockId: string;
  blockVersion: string;
}

/**
 * Block Telemetry Provider
 * 
 * Emits block-visit and block-active-time telemetry automatically based on
 * viewport tracking from ActiveBlockContext.
 */
export function BlockTelemetryProvider({
  navigationNodeId,
  subtopicId,
  sectionId,
  sessionId: propSessionId,
  children,
  heartbeatIntervalMs = 30000,
  enabled = true,
}: BlockTelemetryProviderProps) {
  const { activeBlock } = useActiveBlock();
  
  // Session ID from props
  const sessionIdRef = useRef<string | null>(propSessionId);
  
  // Current timing state
  const timingStateRef = useRef<TimingState | null>(null);
  
  // Last visit identity (for duplicate prevention)
  const lastVisitIdentityRef = useRef<RequestIdentity | null>(null);
  
  // In-flight flush promise (for serialization)
  const flushPromiseRef = useRef<Promise<void> | null>(null);
  
  // Heartbeat timer ID
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  /**
   * Update session ID when prop changes
   */
  useEffect(() => {
    sessionIdRef.current = propSessionId;
    
    if (!propSessionId) {
      console.warn('[BlockTelemetry] No session ID provided - telemetry disabled');
    }
  }, [propSessionId]);
  
  /**
   * Emit block visit event
   * 
   * NOTE: Duplicate prevention flag is set BEFORE request, not after.
   * This means failed visits won't be automatically retried, which is
   * acceptable because:
   * 1. Visit events are idempotent (server can handle duplicates)
   * 2. Active-time accumulation continues regardless of visit success
   * 3. Visit is less critical than time data (used for analytics, not metrics)
   */
  const emitVisit = useCallback(async (
    blockId: string,
    blockVersion: string
  ): Promise<void> => {
    if (!enabled || !sessionIdRef.current) return;
    
    // Duplicate prevention
    if (
      lastVisitIdentityRef.current?.blockId === blockId &&
      lastVisitIdentityRef.current?.blockVersion === blockVersion
    ) {
      return;
    }
    
    lastVisitIdentityRef.current = { blockId, blockVersion };
    
    try {
      const response = await fetch('/api/tutorial/ils/block-visit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionIdRef.current,
        },
        body: JSON.stringify({
          navigationNodeId,
          subtopicId,
          blockId,
          blockVersion,
          sessionId: sessionIdRef.current,
          sectionId,
        }),
      });
      
      if (!response.ok) {
        console.warn(`[BlockTelemetry] Visit failed: ${response.status}`);
      }
    } catch (error) {
      // Silent failure - telemetry must not break UX
      console.error('[BlockTelemetry] Visit error:', error);
    }
  }, [enabled, navigationNodeId, subtopicId, sectionId]);
  
  /**
   * Emit active time increment
   * CRITICAL: activeTimeSec is an INCREMENT (delta), not cumulative
   * 
   * @returns true if request succeeded, false if failed (for retry logic)
   */
  const emitActiveTime = useCallback(async (
    blockId: string,
    blockVersion: string,
    incrementSec: number
  ): Promise<boolean> => {
    if (!enabled || !sessionIdRef.current || incrementSec <= 0) return false;
    
    // Enforce maximum increment (600 seconds per Phase 4.4 API limit)
    const safeIncrement = Math.min(incrementSec, 600);
    
    try {
      const response = await fetch('/api/tutorial/ils/block-active-time', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionIdRef.current,
        },
        body: JSON.stringify({
          navigationNodeId,
          subtopicId,
          blockId,
          blockVersion,
          activeTimeSec: safeIncrement,
          sectionId,
        }),
      });
      
      if (!response.ok) {
        console.warn(`[BlockTelemetry] Active time failed: ${response.status}`);
        return false; // Request failed - time should be retried
      }
      
      return true; // Success
    } catch (error) {
      // Silent failure - telemetry must not break UX
      console.error('[BlockTelemetry] Active time error:', error);
      return false; // Network error - time should be retried
    }
  }, [enabled, navigationNodeId, subtopicId, sectionId]);
  
  /**
   * Flush pending active time (serialized to prevent double-counting)
   */
  const flushPendingTime = useCallback(async (): Promise<void> => {
    if (!timingStateRef.current) return;
    
    // Wait for any in-flight flush to complete (serialization)
    if (flushPromiseRef.current) {
      await flushPromiseRef.current;
    }
    
    const state = timingStateRef.current;
    if (!state) return; // May have been cleared while waiting
    
    // Calculate total pending time
    let totalPendingMs = state.accumulatedMs;
    
    if (!state.isPaused && state.startTime > 0) {
      // Add currently active elapsed time
      const now = performance.now();
      totalPendingMs += (now - state.startTime);
    }
    
    const incrementSec = Math.floor(totalPendingMs / 1000);
    
    if (incrementSec > 0) {
      // Capture request identity to prevent race corruption
      const requestIdentity: RequestIdentity = {
        blockId: state.blockId,
        blockVersion: state.blockVersion,
      };
      
      // CRITICAL: Cap at 600s per API limit, but preserve remainder for next flush
      // Example: 1200s pending → send 600s, preserve 600s for next heartbeat
      const safeIncrement = Math.min(incrementSec, 600);
      const remainderSec = incrementSec - safeIncrement;
      
      // Start flush operation
      const flushPromise = emitActiveTime(
        requestIdentity.blockId,
        requestIdentity.blockVersion,
        safeIncrement
      ).then((success) => {
        // CRITICAL: Only clear time if request succeeded
        // Failed requests leave time pending for retry on next heartbeat
        if (!success) {
          console.warn('[BlockTelemetry] Flush failed - time will be retried on next heartbeat');
          return;
        }
        
        // Verify state hasn't changed while request was pending
        if (
          timingStateRef.current?.blockId === requestIdentity.blockId &&
          timingStateRef.current?.blockVersion === requestIdentity.blockVersion
        ) {
          // SUCCESS: Preserve both fractional milliseconds AND full-second remainder
          if (timingStateRef.current) {
            const fractionalMs = totalPendingMs % 1000;
            const remainderMs = remainderSec * 1000;
            timingStateRef.current.accumulatedMs = fractionalMs + remainderMs;
            
            // Reset start time if still running
            if (!timingStateRef.current.isPaused) {
              timingStateRef.current.startTime = performance.now();
            }
          }
        }
      }).finally(() => {
        flushPromiseRef.current = null;
      });
      
      flushPromiseRef.current = flushPromise;
      await flushPromise;
    }
  }, [emitActiveTime]);
  
  /**
   * Start timing for a block
   */
  const startTiming = useCallback((blockId: string, blockVersion: string) => {
    timingStateRef.current = {
      blockId,
      blockVersion,
      startTime: performance.now(),
      accumulatedMs: 0,
      isPaused: false,
    };
  }, []);
  
  /**
   * Stop timing (does not flush - caller must flush separately)
   */
  const stopTiming = useCallback(() => {
    timingStateRef.current = null;
  }, []);
  
  /**
   * Handle visibility change (pause/resume timing)
   */
  useEffect(() => {
    if (!enabled) return;
    
    const handleVisibilityChange = () => {
      const state = timingStateRef.current;
      if (!state) return;
      
      if (document.visibilityState === 'hidden') {
        // Pause: accumulate elapsed time and stop timer
        if (!state.isPaused && state.startTime > 0) {
          const now = performance.now();
          state.accumulatedMs += (now - state.startTime);
          state.startTime = 0;
          state.isPaused = true;
        }
      } else if (document.visibilityState === 'visible') {
        // Resume: restart timer
        if (state.isPaused) {
          state.startTime = performance.now();
          state.isPaused = false;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);
  
  /**
   * Handle active block changes
   */
  useEffect(() => {
    if (!enabled || !sessionIdRef.current) return;
    
    const currentState = timingStateRef.current;
    
    if (!activeBlock) {
      // No active block - stop timing and flush if needed
      if (currentState) {
        void flushPendingTime().then(() => {
          stopTiming();
        });
      }
      return;
    }
    
    // Coerce undefined blockVersion to 'unversioned' (Phase 4.4 API requirement)
    const blockVersion = activeBlock.blockVersion || 'unversioned';
    
    // Check if this is the same block
    if (
      currentState &&
      currentState.blockId === activeBlock.blockId &&
      currentState.blockVersion === blockVersion
    ) {
      // Same block - no action needed
      return;
    }
    
    // Block change: Flush old block, emit visit for new block, start new timing
    const transitionToNewBlock = async () => {
      // 1. Flush old block's pending time
      if (currentState) {
        await flushPendingTime();
        stopTiming();
      }
      
      // 2. Emit visit for new block
      await emitVisit(activeBlock.blockId, blockVersion);
      
      // 3. Start timing for new block
      startTiming(activeBlock.blockId, blockVersion);
    };
    
    void transitionToNewBlock();
  }, [activeBlock, enabled, flushPendingTime, emitVisit, startTiming, stopTiming]);
  
  /**
   * Heartbeat: Periodically flush accumulated time
   */
  useEffect(() => {
    if (!enabled || heartbeatIntervalMs <= 0) return;
    
    heartbeatTimerRef.current = setInterval(() => {
      void flushPendingTime();
    }, heartbeatIntervalMs);
    
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [enabled, heartbeatIntervalMs, flushPendingTime]);
  
  /**
   * Unmount: Final flush (best-effort)
   */
  useEffect(() => {
    return () => {
      // Final flush on unmount
      if (timingStateRef.current) {
        // Best-effort flush - don't await
        void flushPendingTime();
      }
    };
  }, [flushPendingTime]);
  
  return <>{children}</>;
}
