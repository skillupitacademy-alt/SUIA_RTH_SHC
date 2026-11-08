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

import React, { useEffect, useRef, useCallback, useContext } from 'react';
import { useActiveBlock } from './ActiveBlockContext';
import { TelemetryCallbackContext } from './TelemetryCallbackContext';
import { 
  splitActiveTimeSeconds, 
  createDeliveryEvents,
  BlockTelemetryDeliveryQueue,
  type DeliveryEvent as DeliveryEventType,
  type SendBlockActiveTime,
} from './blockTelemetryDelivery';

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
  sessionId: string;
  blockId: string;
  blockVersion: string;
  startTime: number; // performance.now() when timing started
  accumulatedMs: number; // accumulated time when paused or between flushes
  isPaused: boolean;
}

/**
 * Phase D-2: Use production delivery event type
 */
type DeliveryEvent = DeliveryEventType;

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
  
  // STEP 1: Consume telemetry callback context (behavior implementation deferred to Step 2)
  const telemetryCallbackContext = useContext(TelemetryCallbackContext);
  
  // Current timing state (actively accumulating for current block)
  const timingStateRef = useRef<TimingState | null>(null);
  const transitionGenerationRef = useRef(0);
  const transitionPendingRef = useRef<Promise<void>>(Promise.resolve());
  
  // Phase D-2: Production delivery queue
  const deliveryQueueRef = useRef<BlockTelemetryDeliveryQueue | null>(null);
  
  // Last visit identity (for duplicate prevention)
  const lastVisitIdentityRef = useRef<RequestIdentity | null>(null);
  
  // In-flight flush promise (for serialization)
  const flushPromiseRef = useRef<Promise<void> | null>(null);
  
  // Heartbeat timer ID
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  /**
   * Phase D-2 F2: Snapshot/swap - capture timing and create frozen delivery events
   * CRITICAL: This prevents telemetry loss during in-flight delivery
   */
  const snapshotAndCreateEvents = useCallback((): DeliveryEvent[] => {
    const state = timingStateRef.current;
    if (!state) return [];
    
    // Calculate total accumulated time
    let totalMs = state.accumulatedMs;
    if (!state.isPaused && state.startTime >= 0) {
      const now = performance.now();
      totalMs += (now - state.startTime);
    }
    
    if (totalMs <= 0) return [];
    
    // Phase D-2: SNAPSHOT current state
    const snapshotMs = totalMs;
    
    // Phase D-2: SWAP - reset accumulator IMMEDIATELY (before network I/O)
    state.accumulatedMs = 0;
    state.startTime = state.isPaused ? 0 : performance.now();
    
    // Calculate whole seconds and preserve sub-second remainder
    const wholeSeconds = Math.floor(snapshotMs / 1000);
    const remainderMs = snapshotMs % 1000;
    
    // Preserve remainder in live accumulator
    if (remainderMs > 0) {
      state.accumulatedMs = remainderMs;
    }
    
    if (wholeSeconds <= 0) return [];
    
    // Phase D-2 F1/F4: Use production event creator with splitting
    return createDeliveryEvents({
      navigationNodeId,
      subtopicId,
      sectionId,
      blockId: state.blockId,
      blockVersion: state.blockVersion,
      activeTimeSec: wholeSeconds,
      sessionId: state.sessionId,
    });
  }, [navigationNodeId, subtopicId, sectionId]);
  
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
    blockVersion: string,
    sessionId: string,
  ): Promise<void> => {
    if (!enabled || !sessionId) {
      return;
    }
    
    // Duplicate prevention
    if (
      lastVisitIdentityRef.current?.blockId === blockId &&
      lastVisitIdentityRef.current?.blockVersion === blockVersion
    ) {
      return;
    }
    
    lastVisitIdentityRef.current = { blockId, blockVersion };
    
    const requestPayload = {
      navigationNodeId,
      subtopicId,
      blockId,
      blockVersion,
      sessionId,
      sectionId,
    };
    
    try {
      const response = await fetch('/api/tutorial/ils/block-visit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify(requestPayload),
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        // Silent failure - telemetry must not break UX
      }
    } catch (error) {
      // Silent failure - telemetry must not break UX
    }
  }, [enabled, navigationNodeId, subtopicId, sectionId]);
  
  /**
   * Phase D-2: Initialize production delivery queue
   * Phase 2B.18 Step 1.3 Step 2: Propagate authoritative server state via callback
   */
  const sendBlockActiveTime: SendBlockActiveTime = useCallback(
    async (event: DeliveryEvent) => {
      if (!event.sessionId) {
        return {
          processed: false,
          alreadyProcessed: false,
        };
      }
      
      try {
        const response = await fetch('/api/tutorial/ils/block-active-time', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': event.sessionId,
          },
          body: JSON.stringify({
            navigationNodeId: event.navigationNodeId,
            subtopicId: event.subtopicId,
            sectionId: event.sectionId,
            blockId: event.blockId,
            blockVersion: event.blockVersion,
            eventId: event.eventId,
            activeTimeSec: event.activeTimeSec,
          }),
        });
        
        if (!response.ok) {
          return {
            processed: false,
            alreadyProcessed: false,
          };
        }
        
        const result = await response.json();
        
        // Phase 2B.18 Step 1.3 Step 2: Extract acknowledgement flags
        const processed = result.processed === true;
        const alreadyProcessed = result.alreadyProcessed === true;
        
        // Phase 2B.18 Step 1.3 Step 2: Invoke callback ONLY on successful delivery
        // CRITICAL: Both processed=true AND alreadyProcessed=true are successful outcomes
        // CRITICAL: Callback failure MUST NOT convert successful delivery into retry
        if ((processed || alreadyProcessed) && result.data) {
          const callback = telemetryCallbackContext?.onActiveTimeDeliveryAcknowledged;
          if (callback) {
            try {
              // Phase 2B.18 Step 1.3 Step 2: Transport authoritative cumulative server state
              callback(event.blockId, event.blockVersion, result.data);
            } catch (callbackError) {
              // Isolation: callback failure does not affect delivery success
              // Server has already persisted the active time - callback is a notification
              console.error('[BlockTelemetry] Callback failed (delivery successful):', callbackError);
            }
          }
        }
        
        return {
          processed,
          alreadyProcessed,
        };
      } catch (error) {
        return {
          processed: false,
          alreadyProcessed: false,
        };
      }
    },
    [enabled, telemetryCallbackContext]
  );
  
  /**
   * Phase D-2: Lazy-init production delivery queue
   */
  const getDeliveryQueue = useCallback((): BlockTelemetryDeliveryQueue => {
    if (!deliveryQueueRef.current) {
      deliveryQueueRef.current = new BlockTelemetryDeliveryQueue(sendBlockActiveTime);
    }
    return deliveryQueueRef.current;
  }, [sendBlockActiveTime]);
  
  /**
   * Phase D-2: Flush current timing and deliver all queued events
   */
  const flushAllPending = useCallback(async (): Promise<void> => {
    // Phase D-2 F2: Snapshot/swap to create frozen delivery events
    const newEvents = snapshotAndCreateEvents();
    
    // Add new events to production delivery queue
    const queue = getDeliveryQueue();
    for (const event of newEvents) {
      queue.enqueue(event);
    }
    
    if (queue.getQueuedEventIds().length === 0) return;
    
    // Wait for any in-flight delivery (serialization)
    if (flushPromiseRef.current) {
      await flushPromiseRef.current;
    }
    
    // Phase D-2 F3: Attempt delivery of all queued events using production queue
    const eventIds = queue.getQueuedEventIds();
    
    for (const eventId of eventIds) {
      const flushPromise = queue.deliver(eventId).then(() => {
        // Acknowledgement handled by queue
      }).finally(() => {
        flushPromiseRef.current = null;
      });
      
      flushPromiseRef.current = flushPromise;
      await flushPromise;
    }
  }, [snapshotAndCreateEvents, getDeliveryQueue]);
  
  /**
   * Start timing for a block
   */
  const startTiming = useCallback((blockId: string, blockVersion: string, sessionId: string) => {
    timingStateRef.current = {
      sessionId,
      blockId,
      blockVersion,
      startTime: performance.now(),
      accumulatedMs: 0,
      isPaused: document.visibilityState === 'hidden',
    };
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
        if (!state.isPaused && state.startTime >= 0) {
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
    const generation = ++transitionGenerationRef.current;
    const currentState = timingStateRef.current;
    const nextSession = enabled ? propSessionId : null;
    const blockVersion = activeBlock?.blockVersion || 'unversioned';
    if (currentState && nextSession && activeBlock &&
        currentState.blockId === activeBlock.blockId &&
        currentState.blockVersion === blockVersion &&
        currentState.sessionId === nextSession) {
      void transitionPendingRef.current.then(async () => {
        if (transitionGenerationRef.current === generation) {
          await emitVisit(activeBlock.blockId, blockVersion, nextSession);
        }
      }).catch(error => console.error('[BlockTelemetry] Transition failed:', error));
      return;
    }

    // Snapshot synchronously at the cutover, before awaiting any network request.
    // Fractional time belongs to the old interval and is not transferred.
    const pending = currentState ? flushAllPending() : Promise.resolve();
    transitionPendingRef.current = pending;
    timingStateRef.current = null;
    if (!nextSession || !activeBlock) return;

    if (!currentState || currentState.sessionId !== nextSession) {
      lastVisitIdentityRef.current = null;
    }
    startTiming(activeBlock.blockId, blockVersion, nextSession);

    // FND07: Emit initial visit immediately for the first block (not deferred)
    // This ensures StrictMode effect replay emits exactly one visit
    if (!currentState) {
      void emitVisit(activeBlock.blockId, blockVersion, nextSession);
    } else {
      // For subsequent block changes, wait for old flush to complete
      void pending.then(async () => {
        if (transitionGenerationRef.current === generation) {
          await emitVisit(activeBlock.blockId, blockVersion, nextSession);
        }
      }).catch(error => console.error('[BlockTelemetry] Transition failed:', error));
    }
  }, [activeBlock, enabled, propSessionId, flushAllPending, emitVisit, startTiming]);

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
      transitionGenerationRef.current++;
      // Phase D-2: Final flush using snapshot/swap
      void flushAllPending();
    };
  }, [flushAllPending]);
  
  return <>{children}</>;
}
