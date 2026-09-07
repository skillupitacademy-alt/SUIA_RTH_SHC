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
 * Internal timing state for currently active block
 */
interface TimingState {
  blockId: string;
  blockVersion: string;
  startTime: number; // performance.now() when timing started
  accumulatedMs: number; // accumulated time when paused or between flushes
  isPaused: boolean;
}

/**
 * Pending active time awaiting delivery
 * CRITICAL: Survives block transitions and flush failures
 */
interface PendingActiveTime {
  blockId: string;
  blockVersion: string;
  pendingMs: number;
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
  
  // Current timing state (actively accumulating for current block)
  const timingStateRef = useRef<TimingState | null>(null);
  
  // Pending active-time queue (measured but undelivered, survives transitions)
  // Map structure: blockId+blockVersion → pendingMs
  const pendingQueueRef = useRef<Map<string, PendingActiveTime>>(new Map());
  
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
   * Get unique key for pending queue
   */
  const getPendingKey = useCallback((blockId: string, blockVersion: string): string => {
    return `${blockId}::${blockVersion}`;
  }, []);
  
  /**
   * Add measured time to pending delivery queue
   * Aggregates if entry already exists for this block
   */
  const addToPendingQueue = useCallback((blockId: string, blockVersion: string, ms: number) => {
    if (ms <= 0) return;
    
    const key = getPendingKey(blockId, blockVersion);
    const existing = pendingQueueRef.current.get(key);
    
    if (existing) {
      // Aggregate with existing pending time
      existing.pendingMs += ms;
    } else {
      // Create new pending entry
      pendingQueueRef.current.set(key, {
        blockId,
        blockVersion,
        pendingMs: ms,
      });
    }
    
    // console.log(`[BlockTelemetry] Added to pending queue: ${blockId} +${Math.floor(ms/1000)}s (total pending: ${Math.floor((existing?.pendingMs ?? 0) + ms)/1000}s)`);
  }, [getPendingKey]);
  
  /**
   * Capture currently accumulated time without destroying timing state
   */
  const captureCurrentTiming = useCallback((): { blockId: string; blockVersion: string; ms: number } | null => {
    const state = timingStateRef.current;
    if (!state) return null;
    
    let totalMs = state.accumulatedMs;
    
    if (!state.isPaused && state.startTime > 0) {
      const now = performance.now();
      totalMs += (now - state.startTime);
    }
    
    return {
      blockId: state.blockId,
      blockVersion: state.blockVersion,
      ms: totalMs,
    };
  }, []);
  
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
    // console.log('[ILS-DEBUG][BROWSER][BlockTelemetryProvider] emitVisit called', {
    //   blockId,
    //   blockVersion,
    //   enabled,
    //   hasSessionId: !!sessionIdRef.current,
    //   sessionId: sessionIdRef.current,
    //   navigationNodeId,
    //   subtopicId,
    //   timestamp: new Date().toISOString()
    // });
    
    if (!enabled || !sessionIdRef.current) {
      // console.warn('[ILS-DEBUG][BROWSER][BlockTelemetryProvider] emitVisit SKIPPED - disabled or no sessionId');
      return;
    }
    
    // Duplicate prevention
    if (
      lastVisitIdentityRef.current?.blockId === blockId &&
      lastVisitIdentityRef.current?.blockVersion === blockVersion
    ) {
      // console.log('[ILS-DEBUG][BROWSER][BlockTelemetryProvider] emitVisit SKIPPED - duplicate');
      return;
    }
    
    lastVisitIdentityRef.current = { blockId, blockVersion };
    
    const requestPayload = {
      navigationNodeId,
      subtopicId,
      blockId,
      blockVersion,
      sessionId: sessionIdRef.current,
      sectionId,
    };
    
    // console.log('[ILS-DEBUG][BROWSER][BlockTelemetryProvider] POST /api/tutorial/ils/block-visit', {
    //   url: '/api/tutorial/ils/block-visit',
    //   method: 'POST',
    //   hasSessionIdHeader: !!sessionIdRef.current,
    //   payload: requestPayload
    // });
    
    try {
      const response = await fetch('/api/tutorial/ils/block-visit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionIdRef.current,
        },
        body: JSON.stringify(requestPayload),
      });
      
      // console.log('[ILS-DEBUG][BROWSER][BlockTelemetryProvider] POST /api/tutorial/ils/block-visit response', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   ok: response.ok
      // });
      
      if (!response.ok) {
        const responseText = await response.text();
        // console.warn('[ILS-DEBUG][BROWSER][BlockTelemetryProvider][WARN] Visit failed', {
        //   status: response.status,
        //   responseBody: responseText
        // });
      } else {
        const responseData = await response.json();
        // console.log('[ILS-DEBUG][BROWSER][BlockTelemetryProvider][SUCCESS] Visit succeeded', responseData);
      }
    } catch (error) {
      // Silent failure - telemetry must not break UX
      // console.error('[ILS-DEBUG][BROWSER][BlockTelemetryProvider][ERROR] Visit error:', error);
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
   * Try to deliver pending queue entries
   * Respects 600s API limit and preserves remainders
   * CRITICAL: Does NOT destroy pending entries on failure
   */
  const tryDeliverPending = useCallback(async (): Promise<void> => {
    if (pendingQueueRef.current.size === 0) return;
    
    // Wait for any in-flight delivery (serialization)
    if (flushPromiseRef.current) {
      await flushPromiseRef.current;
    }
    
    // Process each pending entry
    const entries = Array.from(pendingQueueRef.current.entries());
    
    for (const [key, pending] of entries) {
      const incrementSec = Math.floor(pending.pendingMs / 1000);
      
      if (incrementSec <= 0) {
        // Clean up entries with <1s
        pendingQueueRef.current.delete(key);
        continue;
      }
      
      // Cap at 600s per API limit
      const safeIncrement = Math.min(incrementSec, 600);
      const remainderSec = incrementSec - safeIncrement;
      
      // Attempt delivery
      const flushPromise = emitActiveTime(
        pending.blockId,
        pending.blockVersion,
        safeIncrement
      ).then((success) => {
        if (!success) {
          console.warn(`[BlockTelemetry] Delivery failed for ${pending.blockId}, will retry`);
          return;
        }
        
        // SUCCESS: Update or remove pending entry
        const fractionalMs = pending.pendingMs % 1000;
        const remainderMs = remainderSec * 1000;
        const totalRemaining = fractionalMs + remainderMs;
        
        if (totalRemaining > 0) {
          // Update entry with remainder
          pending.pendingMs = totalRemaining;
          // console.log(`[BlockTelemetry] Delivered ${safeIncrement}s for ${pending.blockId}, ${Math.floor(totalRemaining/1000)}s remaining`);
        } else {
          // Fully delivered - remove from queue
          pendingQueueRef.current.delete(key);
          // console.log(`[BlockTelemetry] Fully delivered ${pending.blockId}`);
        }
      }).finally(() => {
        flushPromiseRef.current = null;
      });
      
      flushPromiseRef.current = flushPromise;
      await flushPromise;
      
      // Continue with next entry (allows partial progress)
    }
  }, [emitActiveTime]);
  
  /**
   * Detach current timing to pending queue
   * CRITICAL: Must be called BEFORE stopTiming() to prevent data loss
   */
  const detachCurrentToPending = useCallback(() => {
    const captured = captureCurrentTiming();
    if (!captured || captured.ms <= 0) return;
    
    addToPendingQueue(captured.blockId, captured.blockVersion, captured.ms);
    
    // Clear current timing state to prevent double-counting
    if (timingStateRef.current) {
      timingStateRef.current.accumulatedMs = 0;
      timingStateRef.current.startTime = performance.now();
    }
  }, [captureCurrentTiming, addToPendingQueue]);
  
  /**
   * Flush current timing + attempt delivery of all pending
   * This is the primary entry point for heartbeat/transition flush
   */
  const flushAllPending = useCallback(async (): Promise<void> => {
    // 1. Detach current timing to pending queue (if any)
    detachCurrentToPending();
    
    // 2. Attempt delivery of all pending entries
    await tryDeliverPending();
  }, [detachCurrentToPending, tryDeliverPending]);
  
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
      // No active block - detach timing and stop
      if (currentState) {
        // Detach to pending queue (safe even if flush fails)
        detachCurrentToPending();
        stopTiming();
        
        // Best-effort delivery (non-blocking)
        void tryDeliverPending();
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
    
    // Block change: Safe transition with durable pending queue
    const transitionToNewBlock = async () => {
      // 1. CRITICAL: Detach old block's timing to pending queue BEFORE stopping
      //    This ensures measured time survives even if delivery fails
      if (currentState) {
        detachCurrentToPending();
        stopTiming();
      }
      
      // 2. Best-effort delivery (non-blocking, failures preserved in queue)
      void tryDeliverPending();
      
      // 3. Emit visit for new block
      await emitVisit(activeBlock.blockId, blockVersion);
      
      // 4. Start timing for new block
      startTiming(activeBlock.blockId, blockVersion);
    };
    
    void transitionToNewBlock();
  }, [activeBlock, enabled, detachCurrentToPending, tryDeliverPending, emitVisit, startTiming, stopTiming]);
  
  /**
   * Heartbeat: Periodically flush accumulated time and retry pending
   */
  useEffect(() => {
    if (!enabled || heartbeatIntervalMs <= 0) return;
    
    heartbeatTimerRef.current = setInterval(() => {
      void flushAllPending();
    }, heartbeatIntervalMs);
    
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [enabled, heartbeatIntervalMs, flushAllPending]);
  
  /**
   * Unmount: Final flush (best-effort)
   */
  useEffect(() => {
    return () => {
      // Detach current timing to pending queue
      if (timingStateRef.current) {
        const captured = captureCurrentTiming();
        if (captured && captured.ms > 0) {
          addToPendingQueue(captured.blockId, captured.blockVersion, captured.ms);
        }
      }
      
      // Best-effort delivery of all pending
      void tryDeliverPending();
    };
  }, [captureCurrentTiming, addToPendingQueue, tryDeliverPending]);
  
  return <>{children}</>;
}
