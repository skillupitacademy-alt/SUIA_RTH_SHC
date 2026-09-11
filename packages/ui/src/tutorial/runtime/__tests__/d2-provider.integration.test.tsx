/**
 * Gate 3C.1R Phase D-2
 *
 * Provider-level production-path integration tests.
 *
 * CRITICAL: These tests MUST exercise the ACTUAL provider lifecycle:
 *
 * BlockTelemetryProvider
 *   -> snapshotAndCreateEvents()
 *   -> createDeliveryEvents() [production]
 *   -> BlockTelemetryDeliveryQueue [production]
 *   -> sendBlockActiveTime()
 *   -> fetch()
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import React from 'react';

import { BlockTelemetryProvider } from '../BlockTelemetryProvider';
import {
  ActiveBlockContext,
  type ActiveBlockIdentity,
} from '../ActiveBlockContext';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BLOCK_A: ActiveBlockIdentity = {
  blockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
  blockType: 'D1',
  blockVersion: 'D1',
};

const BLOCK_B: ActiveBlockIdentity = {
  blockId: '00000000-0000-0000-0000-000000000002',
  blockType: 'C1',
  blockVersion: 'C1',
};

const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SESSION_ID = 'test-session';

type DeliveryEventBody = {
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  blockId: string;
  blockVersion: string;
  eventId: string;
  activeTimeSec: number;
};

interface HarnessHandle {
  setActiveBlock: (block: ActiveBlockIdentity | null) => void;
}

function createResponse(
  body: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function Harness({
  initialBlock = BLOCK_A,
  handle,
  heartbeatIntervalMs = 0,
}: {
  initialBlock?: ActiveBlockIdentity | null;
  handle: React.MutableRefObject<HarnessHandle | null>;
  heartbeatIntervalMs?: number;
}) {
  const [activeBlock, setActiveBlock] =
    React.useState<ActiveBlockIdentity | null>(initialBlock);

  React.useEffect(() => {
    handle.current = {
      setActiveBlock,
    };

    return () => {
      handle.current = null;
    };
  }, [handle]);

  return (
    <ActiveBlockContext.Provider
      value={{
        activeBlock,
      }}
    >
      <BlockTelemetryProvider
        navigationNodeId={NAVIGATION_NODE_ID}
        subtopicId={SUBTOPIC_ID}
        sectionId={null}
        sessionId={SESSION_ID}
        heartbeatIntervalMs={heartbeatIntervalMs}
        enabled={true}
      >
        <div data-testid="provider-test">test</div>
      </BlockTelemetryProvider>
    </ActiveBlockContext.Provider>
  );
}

describe('D-2 Provider Integration Tests', () => {
  let nowMs: number;
  let performanceNowSpy: ReturnType<typeof vi.spyOn>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // performance.now() is a monotonic clock and zero is a valid value.
    // Start above zero so the provider's elapsed-time lifecycle is exercised
    // without relying on zero as an implicit "not started" sentinel.
    nowMs = 1_000;

    performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => nowMs);

    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/tutorial/ils/block-active-time')) {
          return createResponse({
            processed: true,
            alreadyProcessed: false,
          });
        }

        if (url.includes('/api/tutorial/ils/block-visit')) {
          return createResponse({});
        }

        return createResponse({});
      });
  });

  afterEach(() => {
    performanceNowSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  function activeTimeCalls() {
    return fetchSpy.mock.calls.filter(([input]: [RequestInfo | URL, ...unknown[]]) =>
      String(input).includes('/api/tutorial/ils/block-active-time')
    );
  }

  function visitCalls() {
    return fetchSpy.mock.calls.filter(([input]: [RequestInfo | URL, ...unknown[]]) =>
      String(input).includes('/api/tutorial/ils/block-visit')
    );
  }

  function bodyAt(index: number): DeliveryEventBody {
    const calls = activeTimeCalls();
    return JSON.parse(String(calls[index]?.[1]?.body)) as DeliveryEventBody;
  }

  // ==========================================================================
  // F2: SAME-BLOCK IN-FLIGHT ACCUMULATION
  // ==========================================================================

  it(
    'F2: preserves time accumulated while first delivery is in-flight (heartbeat)',
    async () => {
      let resolveFirstRequest: ((response: Response) => void) | null = null;

      const firstRequest = new Promise<Response>((resolve) => {
        resolveFirstRequest = resolve;
      });

      let activeTimeAttempt = 0;

      fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/tutorial/ils/block-active-time')) {
          activeTimeAttempt++;

          if (activeTimeAttempt === 1) {
            return firstRequest;
          }

          return createResponse({
            processed: true,
            alreadyProcessed: false,
          });
        }

        if (url.includes('/api/tutorial/ils/block-visit')) {
          return createResponse({});
        }

        return createResponse({});
      });

      const handle = React.createRef<HarnessHandle | null>();

      // Use short heartbeat for testing (10ms)
      render(<Harness handle={handle} heartbeatIntervalMs={10} />);

      await waitFor(() => {
        expect(visitCalls().length).toBe(1);
      });

      // Accumulate 30 seconds
      nowMs = 31_000;

      // Wait for heartbeat to initiate delivery
      await waitFor(() => {
        expect(activeTimeCalls().length).toBe(1);
      }, { timeout: 500 });

      const firstBody = bodyAt(0);

      expect(firstBody.activeTimeSec).toBe(30);
      expect(firstBody.eventId).toMatch(UUID_PATTERN);
      expect(firstBody.blockId).toBe(BLOCK_A.blockId);

      const firstEventId = firstBody.eventId;

      // CRITICAL: Accumulate another 10 seconds on SAME block while request is in-flight
      nowMs = 41_000;

      // Resolve first request
      resolveFirstRequest?.(
        createResponse({
          processed: true,
          alreadyProcessed: false,
        })
      );

      // Wait for next heartbeat to deliver the +10 seconds
      await waitFor(() => {
        expect(activeTimeCalls().length).toBe(2);
      }, { timeout: 500 });

      const secondBody = bodyAt(1);

      // CRITICAL D-2 F2 PROOF: Second event is the +10 seconds
      expect(secondBody.activeTimeSec).toBe(10);
      expect(secondBody.eventId).toMatch(UUID_PATTERN);
      expect(secondBody.eventId).not.toBe(firstEventId);

      // First event remained immutable
      const verifyFirstBody = bodyAt(0);
      expect(verifyFirstBody.activeTimeSec).toBe(30);
      expect(verifyFirstBody.eventId).toBe(firstEventId);
    },
    15000
  );

  // ==========================================================================
  // F3: RETRY WITH SAME EVENT ID
  // ==========================================================================

  it(
    'F3: retries failed delivery with identical eventId and payload',
    async () => {
      let attempt = 0;

      fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/tutorial/ils/block-active-time')) {
          attempt++;

          if (attempt === 1) {
            throw new Error('intentional network failure');
          }

          if (attempt === 2) {
            return createResponse({
              processed: true,
              alreadyProcessed: false,
            });
          }

          throw new Error('unexpected third active-time attempt');
        }

        if (url.includes('/api/tutorial/ils/block-visit')) {
          return createResponse({});
        }

        return createResponse({});
      });

      const handle = React.createRef<HarnessHandle | null>();

      // IMPORTANT:
      // 250ms deliberately separates first failed delivery from retry.
      render(<Harness handle={handle} heartbeatIntervalMs={250} />);

      await waitFor(() => {
        expect(visitCalls().length).toBe(1);
      });

      // Accumulate 30 seconds.
      nowMs = 31_000;

      // Wait for the FIRST heartbeat / FIRST delivery only.
      await waitFor(
        () => {
          expect(activeTimeCalls().length).toBe(1);
        },
        { timeout: 500 }
      );

      // The first request must have failed.
      expect(attempt).toBe(1);

      const firstBody = bodyAt(0);

      expect(firstBody.activeTimeSec).toBe(30);
      expect(firstBody.eventId).toMatch(UUID_PATTERN);
      expect(firstBody.navigationNodeId).toBe(NAVIGATION_NODE_ID);
      expect(firstBody.subtopicId).toBe(SUBTOPIC_ID);
      expect(firstBody.sectionId).toBeNull();
      expect(firstBody.blockId).toBe(BLOCK_A.blockId);
      expect(firstBody.blockVersion).toBe(BLOCK_A.blockVersion);

      // IMPORTANT:
      // At this point there must still be exactly one attempt.
      expect(activeTimeCalls().length).toBe(1);

      // The next heartbeat should retry the SAME queued event.
      await waitFor(
        () => {
          expect(activeTimeCalls().length).toBe(2);
        },
        { timeout: 1000 }
      );

      expect(attempt).toBe(2);

      const retryBody = bodyAt(1);

      // CRITICAL D-2 F3 PROOF:
      // Retry must be the exact same immutable logical event.
      expect(retryBody.eventId).toBe(firstBody.eventId);
      expect(retryBody.activeTimeSec).toBe(firstBody.activeTimeSec);
      expect(retryBody.navigationNodeId).toBe(firstBody.navigationNodeId);
      expect(retryBody.subtopicId).toBe(firstBody.subtopicId);
      expect(retryBody.sectionId).toBe(firstBody.sectionId);
      expect(retryBody.blockId).toBe(firstBody.blockId);
      expect(retryBody.blockVersion).toBe(firstBody.blockVersion);

      // No third attempt should occur after successful acknowledgement.
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      expect(activeTimeCalls().length).toBe(2);
      expect(attempt).toBe(2);
    },
    15000
  );

  // ==========================================================================
  // F3: ALREADY PROCESSED ACKNOWLEDGEMENT
  // ==========================================================================

  it(
    'F3: treats alreadyProcessed=true as successful acknowledgement',
    async () => {
      fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/tutorial/ils/block-active-time')) {
          return createResponse({
            processed: false,
            alreadyProcessed: true,
          });
        }

        if (url.includes('/api/tutorial/ils/block-visit')) {
          return createResponse({});
        }

        return createResponse({});
      });

      const handle = React.createRef<HarnessHandle | null>();

      // Use short heartbeat
      render(<Harness handle={handle} heartbeatIntervalMs={10} />);

      await waitFor(() => {
        expect(visitCalls().length).toBe(1);
      });

      // Accumulate 30 seconds
      nowMs = 31_000;

      // Wait for heartbeat to send request
      await waitFor(() => {
        expect(activeTimeCalls().length).toBe(1);
      }, { timeout: 500 });

      const firstBody = bodyAt(0);

      expect(firstBody.activeTimeSec).toBe(30);
      expect(firstBody.eventId).toMatch(UUID_PATTERN);

      // Wait enough time for potential retry
      await new Promise((resolve) => setTimeout(resolve, 50));

      // alreadyProcessed is acknowledgement - NO RETRY
      expect(activeTimeCalls().length).toBe(1);
    },
    15000
  );

  // ==========================================================================
  // F4: PROVIDER-PATH 600-SECOND SPLITTING
  // ==========================================================================

  it(
    'F4: provider emits 1250 seconds as 600 + 600 + 50',
    async () => {
      fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/tutorial/ils/block-active-time')) {
          return createResponse({
            processed: true,
            alreadyProcessed: false,
          });
        }

        return createResponse({});
      });

      const handle = React.createRef<HarnessHandle | null>();

      render(<Harness handle={handle} heartbeatIntervalMs={10} />);

      await waitFor(() => {
        expect(visitCalls().length).toBe(1);
      });

      // Accumulate 1250 seconds
      nowMs = 1_251_000;

      // Wait for heartbeat to deliver all 3 chunks
      await waitFor(() => {
        expect(activeTimeCalls().length).toBe(3);
      }, { timeout: 500 });

      const events = activeTimeCalls().map((_: unknown, index: number) => bodyAt(index));

      // CRITICAL D-2 F4 PROOF: Provider path produces 600 + 600 + 50
      expect(events.map((event: DeliveryEventBody) => event.activeTimeSec)).toEqual([
        600, 600, 50,
      ]);

      expect(new Set(events.map((event: DeliveryEventBody) => event.eventId)).size).toBe(3);

      for (const event of events) {
        expect(event.eventId).toMatch(UUID_PATTERN);
        expect(event.blockId).toBe(BLOCK_A.blockId);
        expect(event.blockVersion).toBe(BLOCK_A.blockVersion);
      }
    },
    15000
  );
});
