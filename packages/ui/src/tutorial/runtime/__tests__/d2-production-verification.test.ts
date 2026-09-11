/**
 * Gate 3C.1R Phase D-2: Production Implementation Verification
 * 
 * F1: Event ID stability across retry
 * F2: Lossless in-flight accumulation (snapshot/swap)
 * F3: Failed delivery retry
 * F4: 600-second splitting
 * 
 * CRITICAL: These tests exercise PRODUCTION code, not synthetic duplicates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  splitActiveTimeSeconds,
  createDeliveryEvents,
  snapshotAccumulator,
  BlockTelemetryDeliveryQueue,
  type DeliveryEvent,
  type LiveAccumulator,
} from '../blockTelemetryDelivery';

describe('D-2 Frontend Production Verification', () => {
  // ==========================================================================
  // F4: 600-SECOND SPLITTING — PRODUCTION FUNCTION
  // ==========================================================================
  
  describe('F4: Production 600-second splitting', () => {
    it('F4-1: splits 600 seconds into [600]', () => {
      expect(splitActiveTimeSeconds(600)).toEqual([600]);
    });

    it('F4-2: splits 601 seconds into [600, 1]', () => {
      expect(splitActiveTimeSeconds(601)).toEqual([600, 1]);
    });

    it('F4-3: splits 1200 seconds into [600, 600]', () => {
      expect(splitActiveTimeSeconds(1200)).toEqual([600, 600]);
    });

    it('F4-4: splits 1201 seconds into [600, 600, 1]', () => {
      expect(splitActiveTimeSeconds(1201)).toEqual([600, 600, 1]);
    });

    it('F4-5: splits 1250 seconds into [600, 600, 50]', () => {
      expect(splitActiveTimeSeconds(1250)).toEqual([600, 600, 50]);
    });

    it('F4-6: all chunks are within 0-600 range', () => {
      const chunks = splitActiveTimeSeconds(1250);
      expect(chunks.every((value) => value >= 0 && value <= 600)).toBe(true);
    });

    it('F4-7: sum equals original total', () => {
      const chunks = splitActiveTimeSeconds(1250);
      expect(chunks.reduce((sum, value) => sum + value, 0)).toBe(1250);
    });

    it('F4-8: handles zero seconds', () => {
      expect(splitActiveTimeSeconds(0)).toEqual([]);
    });

    it('F4-9: handles negative seconds', () => {
      expect(splitActiveTimeSeconds(-10)).toEqual([]);
    });
  });

  // ==========================================================================
  // F1: EVENT ID GENERATION — PRODUCTION FUNCTION
  // ==========================================================================
  
  describe('F1: Production event ID generation', () => {
    it('F1-1: each logical delivery event receives one stable eventId', () => {
      const events = createDeliveryEvents({
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 30,
      });

      expect(events).toHaveLength(1);

      const event = events[0];

      expect(event.eventId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      expect(event.activeTimeSec).toBe(30);
      expect(event.blockId).toBe('79ae6e0f-0374-4dfe-8d76-cefbe42f8996');
      expect(event.blockVersion).toBe('D1');
    });

    it('F1-2: chunked events each get unique eventIds', () => {
      const events = createDeliveryEvents({
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 1250,
      });

      expect(events).toHaveLength(3);
      expect(events.map((e) => e.activeTimeSec)).toEqual([600, 600, 50]);

      const ids = events.map((e) => e.eventId);
      expect(new Set(ids).size).toBe(3);

      ids.forEach((id) => {
        expect(id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      });
    });

    it('F1-3: total time preserved across chunks', () => {
      const events = createDeliveryEvents({
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 1250,
      });

      const total = events.reduce((sum, event) => sum + event.activeTimeSec, 0);
      expect(total).toBe(1250);
    });
  });

  // ==========================================================================
  // F2: SNAPSHOT/SWAP — PRODUCTION FUNCTION
  // ==========================================================================
  
  describe('F2: Production snapshot/swap', () => {
    it('F2-1: snapshot preserves original accumulator state', () => {
      const original: LiveAccumulator = {
        blockId: 'block-1',
        blockVersion: 'D1',
        pendingMs: 30000,
      };

      const { snapshot, live } = snapshotAccumulator(original);

      expect(snapshot.pendingMs).toBe(30000);
      expect(snapshot.blockId).toBe('block-1');
      expect(snapshot.blockVersion).toBe('D1');
    });

    it('F2-2: new live accumulator is independent', () => {
      const original: LiveAccumulator = {
        blockId: 'block-1',
        blockVersion: 'D1',
        pendingMs: 30000,
      };

      const { snapshot, live } = snapshotAccumulator(original);

      expect(live.pendingMs).toBe(0);
      expect(live.blockId).toBe('block-1');
      expect(live.blockVersion).toBe('D1');
    });

    it('F2-3: telemetry accumulated during in-flight delivery is preserved separately', () => {
      let currentLive: LiveAccumulator = {
        blockId: 'block-1',
        blockVersion: 'D1',
        pendingMs: 30000,
      };

      // Snapshot/swap
      const { snapshot, live: newLive } = snapshotAccumulator(currentLive);
      currentLive = newLive;

      // Create frozen event from snapshot
      const frozenEvent = {
        eventId: crypto.randomUUID(),
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null as string | null,
        blockId: snapshot.blockId,
        blockVersion: snapshot.blockVersion,
        activeTimeSec: Math.floor(snapshot.pendingMs / 1000),
      };

      // Simulate: Request is in flight, new telemetry arrives
      currentLive.pendingMs += 10000;

      // CRITICAL: Frozen event must remain unchanged
      expect(frozenEvent.activeTimeSec).toBe(30);

      // CRITICAL: New telemetry must be preserved
      expect(currentLive.pendingMs).toBe(10000);
    });

    it('F2-4: first event remains unchanged after new accumulation', () => {
      const original: LiveAccumulator = {
        blockId: 'block-1',
        blockVersion: 'D1',
        pendingMs: 30000,
      };

      const { snapshot } = snapshotAccumulator(original);

      const frozenActiveTimeSec = Math.floor(snapshot.pendingMs / 1000);

      // Mutate original (simulating continued accumulation)
      original.pendingMs += 10000;

      // Snapshot must remain unchanged
      expect(Math.floor(snapshot.pendingMs / 1000)).toBe(frozenActiveTimeSec);
      expect(frozenActiveTimeSec).toBe(30);
    });
  });

  // ==========================================================================
  // F3: FAILED DELIVERY RETRY — PRODUCTION QUEUE
  // ==========================================================================
  
  describe('F3: Production delivery queue retry', () => {
    it('F3-1: network failure retains event in queue', async () => {
      const event: DeliveryEvent = {
        eventId: crypto.randomUUID(),
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 30,
      };

      const send = async () => {
        throw new Error('network failure');
      };

      const queue = new BlockTelemetryDeliveryQueue(send);
      queue.enqueue(event);

      // Delivery fails but does not throw (swallowed for telemetry resilience)
      const acknowledged = await queue.deliver(event.eventId);
      expect(acknowledged).toBe(false);

      // Event must remain in queue
      expect(queue.get(event.eventId)).toEqual(event);
    });

    it('F3-2: retry uses same eventId', async () => {
      const calls: DeliveryEvent[] = [];
      let attempt = 0;

      const send = async (event: DeliveryEvent) => {
        calls.push({ ...event });
        attempt++;

        if (attempt === 1) {
          throw new Error('network failure');
        }

        return {
          processed: true,
          alreadyProcessed: false,
        };
      };

      const event: DeliveryEvent = {
        eventId: crypto.randomUUID(),
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 30,
      };

      const queue = new BlockTelemetryDeliveryQueue(send);
      queue.enqueue(event);

      // First attempt fails (exception swallowed)
      const firstResult = await queue.deliver(event.eventId);
      expect(firstResult).toBe(false);

      // Retry
      const retryResult = await queue.deliver(event.eventId);
      expect(retryResult).toBe(true);

      expect(calls).toHaveLength(2);

      // CRITICAL: Same eventId across retry
      expect(calls[1].eventId).toBe(calls[0].eventId);
    });

    it('F3-3: retry uses same payload', async () => {
      const calls: DeliveryEvent[] = [];
      let attempt = 0;

      const send = async (event: DeliveryEvent) => {
        calls.push({ ...event });
        attempt++;

        if (attempt === 1) {
          throw new Error('network failure');
        }

        return {
          processed: true,
          alreadyProcessed: false,
        };
      };

      const event: DeliveryEvent = {
        eventId: crypto.randomUUID(),
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 30,
      };

      const queue = new BlockTelemetryDeliveryQueue(send);
      queue.enqueue(event);

      // First attempt fails (exception swallowed)
      await queue.deliver(event.eventId);

      // Retry
      await queue.deliver(event.eventId);

      // CRITICAL: Entire payload unchanged
      expect(calls[1]).toEqual(calls[0]);
    });

    it('F3-4: alreadyProcessed is successful acknowledgement', async () => {
      const event: DeliveryEvent = {
        eventId: crypto.randomUUID(),
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 30,
      };

      const send = async () => ({
        processed: false,
        alreadyProcessed: true,
      });

      const queue = new BlockTelemetryDeliveryQueue(send);
      queue.enqueue(event);

      const acknowledged = await queue.deliver(event.eventId);

      expect(acknowledged).toBe(true);

      // Event must be removed from queue
      expect(queue.get(event.eventId)).toBeUndefined();
    });

    it('F3-5: processed=true removes event from queue', async () => {
      const event: DeliveryEvent = {
        eventId: crypto.randomUUID(),
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 30,
      };

      const send = async () => ({
        processed: true,
        alreadyProcessed: false,
      });

      const queue = new BlockTelemetryDeliveryQueue(send);
      queue.enqueue(event);

      const acknowledged = await queue.deliver(event.eventId);

      expect(acknowledged).toBe(true);
      expect(queue.get(event.eventId)).toBeUndefined();
    });

    it('F3-6: duplicate simultaneous delivery prevented', async () => {
      let callCount = 0;

      const send = async () => {
        callCount++;
        // Simulate slow request
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          processed: true,
          alreadyProcessed: false,
        };
      };

      const event: DeliveryEvent = {
        eventId: crypto.randomUUID(),
        navigationNodeId: 'whatisjava',
        subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
        sectionId: null,
        blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
        blockVersion: 'D1',
        activeTimeSec: 30,
      };

      const queue = new BlockTelemetryDeliveryQueue(send);
      queue.enqueue(event);

      // Attempt simultaneous delivery
      const delivery1 = queue.deliver(event.eventId);
      const delivery2 = queue.deliver(event.eventId);

      await Promise.all([delivery1, delivery2]);

      // Only one actual request should occur
      expect(callCount).toBe(1);
    });
  });
});
