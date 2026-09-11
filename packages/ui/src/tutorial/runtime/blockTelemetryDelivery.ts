/**
 * Gate 3C.1R Phase D-2: Block Telemetry Delivery
 * 
 * Production implementations of D-2 idempotent delivery mechanisms:
 * - F1: Event ID generation
 * - F2: Snapshot/swap accumulator separation
 * - F3: Retry queue management
 * - F4: 600-second chunking
 */

/**
 * Phase D-2: Immutable delivery event
 */
export interface DeliveryEvent {
  eventId: string;
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  blockId: string;
  blockVersion: string;
  activeTimeSec: number;
}

/**
 * Phase D-2: Live accumulator (mutable, separate from frozen delivery events)
 */
export interface LiveAccumulator {
  blockId: string;
  blockVersion: string;
  pendingMs: number;
}

/**
 * Phase D-2 F4: Split active time into 600-second chunks
 * 
 * @param totalSeconds - Total active time in whole seconds
 * @returns Array of chunks, each ≤ 600 seconds
 */
export function splitActiveTimeSeconds(totalSeconds: number): number[] {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return [];
  }
  
  const result: number[] = [];
  let remaining = Math.floor(totalSeconds);
  
  while (remaining > 0) {
    const chunk = Math.min(remaining, 600);
    result.push(chunk);
    remaining -= chunk;
  }
  
  return result;
}

/**
 * Phase D-2 F1: Create delivery events from active time
 * Each event gets a unique eventId
 * Large time values are split into 600-second chunks
 * 
 * @param input - Event metadata and total active time
 * @returns Array of immutable delivery events
 */
export function createDeliveryEvents(input: {
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  blockId: string;
  blockVersion: string;
  activeTimeSec: number;
}): DeliveryEvent[] {
  const chunks = splitActiveTimeSeconds(input.activeTimeSec);
  
  return chunks.map((activeTimeSec) => ({
    eventId: crypto.randomUUID(),
    navigationNodeId: input.navigationNodeId,
    subtopicId: input.subtopicId,
    sectionId: input.sectionId,
    blockId: input.blockId,
    blockVersion: input.blockVersion,
    activeTimeSec,
  }));
}

/**
 * Phase D-2 F2: Snapshot live accumulator and create replacement
 * CRITICAL: This implements the snapshot/swap pattern for lossless accumulation
 * 
 * @param current - Current live accumulator
 * @returns Snapshot of current state and new empty accumulator
 */
export function snapshotAccumulator(current: LiveAccumulator): {
  snapshot: LiveAccumulator;
  live: LiveAccumulator;
} {
  const snapshot = { ...current };
  
  const live = {
    blockId: current.blockId,
    blockVersion: current.blockVersion,
    pendingMs: 0,
  };
  
  return {
    snapshot,
    live,
  };
}

/**
 * Phase D-2 F3: Delivery queue with retry support
 */
export type SendBlockActiveTime = (
  event: DeliveryEvent
) => Promise<{
  processed: boolean;
  alreadyProcessed: boolean;
}>;

/**
 * Phase D-2: Delivery queue implementation
 */
export class BlockTelemetryDeliveryQueue {
  private readonly queue = new Map<string, DeliveryEvent>();
  private readonly inFlight = new Set<string>();
  
  constructor(private readonly send: SendBlockActiveTime) {}
  
  /**
   * Add event to delivery queue
   */
  enqueue(event: DeliveryEvent): void {
    this.queue.set(event.eventId, event);
  }
  
  /**
   * Get event from queue
   */
  get(eventId: string): DeliveryEvent | undefined {
    return this.queue.get(eventId);
  }
  
  /**
   * Check if event is in flight
   */
  isInFlight(eventId: string): boolean {
    return this.inFlight.has(eventId);
  }
  
  /**
   * Get all queued event IDs
   */
  getQueuedEventIds(): string[] {
    return Array.from(this.queue.keys());
  }
  
  /**
   * Phase D-2 F3: Deliver event with retry support
   * 
   * @param eventId - Event to deliver
   * @returns true if acknowledged (processed or alreadyProcessed), false otherwise
   */
  async deliver(eventId: string): Promise<boolean> {
    const event = this.queue.get(eventId);
    
    if (!event) {
      return false;
    }
    
    // Phase D-2: Prevent duplicate simultaneous delivery
    if (this.inFlight.has(eventId)) {
      return false;
    }
    
    this.inFlight.add(eventId);
    
    try {
      const result = await this.send(event);
      
      // Phase D-2 F3: Both processed and alreadyProcessed are successful outcomes
      if (result.processed === true || result.alreadyProcessed === true) {
        this.queue.delete(eventId);
        return true;
      }
      
      // Unexpected response - retain for retry
      return false;
    } catch (error) {
      // Network failure - retain for retry
      return false;
    } finally {
      this.inFlight.delete(eventId);
    }
  }
}
