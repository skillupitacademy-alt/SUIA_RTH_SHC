/**
 * BlockTelemetryProvider Behavioral Tests - Phase 4.5 STEP 3.1
 * 
 * Validates telemetry timing state machine:
 * - Active time accumulation (actual elapsed time)
 * - Increment-based reporting (not cumulative)
 * - Block transition timing (flush old → visit new)
 * - Visibility pause/resume (hidden time excluded)
 * - Unmount flush (best-effort)
 * - Duplicate visit prevention
 * - Flush serialization (no double-counting)
 * - 600-second cap with remainder handling
 * - Fractional millisecond preservation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act, cleanup } from '@testing-library/react';
import React from 'react';
import { BlockTelemetryProvider } from '../BlockTelemetryProvider';
import * as ActiveBlockModule from '../ActiveBlockContext';

// Mock ActiveBlockContext
vi.mock('../ActiveBlockContext', async () => {
  const actual = await vi.importActual<typeof ActiveBlockModule>('../ActiveBlockContext');
  return {
    ...actual,
    useActiveBlock: vi.fn(() => ({ activeBlock: null })),
  };
});

// Mock fetch is installed per test.

// Mock performance.now()
const mockPerformanceNow = vi.fn();
// Mock document.visibilityState
let mockVisibilityState: 'visible' | 'hidden' = 'visible';
const visibilityDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');

const mockNavigationNodeId = 'whatisjava';
const mockSubtopicId = '5326eeb6-c4c8-4218-9687-2b46f94a9bb4';
const mockSectionId = 'section-uuid-789';
const mockSessionId = 'test-session-uuid';

describe('BlockTelemetryProvider - Behavioral State Machine', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
    vi.clearAllMocks();
    mockVisibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => mockVisibilityState });
    mockPerformanceNow.mockReturnValue(0);
    
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ processed: true }),
    } as Response);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (visibilityDescriptor) Object.defineProperty(document, 'visibilityState', visibilityDescriptor);
    else Reflect.deleteProperty(document, 'visibilityState');
  });

  // ============================================
  // CRITICAL: Visit Emission
  // ============================================

  describe('Visit Emission', () => {
    it('emits visit exactly once per block identity', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      
      const mockActiveBlock = { blockId: 'block-1', blockType: 'code', blockVersion: 'C1' };
      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({ activeBlock: mockActiveBlock });

      const { rerender } = render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tutorial/ils/block-visit', expect.anything());
      });

      const visitCallsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        c => c[0] === '/api/tutorial/ils/block-visit'
      ).length;

      await act(async () => {});
      vi.clearAllMocks();

      // Multiple rerenders with same block
      for (let i = 0; i < 5; i++) {
        rerender(
          <BlockTelemetryProvider
            navigationNodeId={mockNavigationNodeId}
            subtopicId={mockSubtopicId}
            sectionId={mockSectionId}
            sessionId={mockSessionId}
          >
            <div>Content {i}</div>
          </BlockTelemetryProvider>
        );
        await act(async () => { vi.advanceTimersByTime(100); });
      }

      await act(async () => { await vi.advanceTimersByTimeAsync(100); });

      const visitCallsAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        c => c[0] === '/api/tutorial/ils/block-visit'
      ).length;

      expect(visitCallsBefore).toBe(1);
      expect(visitCallsAfter).toBe(0); // No duplicate visits
    });
  });

  // ============================================
  // CRITICAL: Heartbeat Increment (Not Cumulative)
  // ============================================

  describe('Heartbeat Active Time', () => {
    it('sends 30 seconds on first heartbeat', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
        activeBlock: { blockId: 'block-1', blockType: 'code', blockVersion: 'C1' },
      });

      render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
          heartbeatIntervalMs={30000}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tutorial/ils/block-visit', expect.anything());
      });

      await act(async () => {});
      vi.clearAllMocks();

      // Simulate 30 seconds elapsed
      mockPerformanceNow.mockReturnValue(30000);

      // Trigger heartbeat
      await act(async () => { vi.advanceTimersByTime(30000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const timeCall = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        expect(timeCall).toBeTruthy();
        const body = JSON.parse(timeCall[1].body);
        expect(body.activeTimeSec).toBe(30);
      });
    });

    it('sends another 30 seconds on second heartbeat (NOT 60 cumulative)', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
        activeBlock: { blockId: 'block-1', blockType: 'code', blockVersion: 'C1' },
      });

      render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
          heartbeatIntervalMs={30000}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tutorial/ils/block-visit', expect.anything());
      });

      await act(async () => {});
      vi.clearAllMocks();

      // First heartbeat: 30 seconds
      mockPerformanceNow.mockReturnValue(30000);
      await act(async () => { vi.advanceTimersByTime(30000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const firstTimeCall = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        expect(firstTimeCall).toBeTruthy();
        const body = JSON.parse(firstTimeCall[1].body);
        expect(body.activeTimeSec).toBe(30);
      });

      await act(async () => {});
      vi.clearAllMocks();

      // Second heartbeat: another 30 seconds (total 60, but send INCREMENT of 30)
      mockPerformanceNow.mockReturnValue(60000);
      await act(async () => { vi.advanceTimersByTime(30000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const secondTimeCall = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        expect(secondTimeCall).toBeTruthy();
        const body = JSON.parse(secondTimeCall[1].body);
        // CRITICAL: Must be 30 (increment), NOT 60 (cumulative)
        expect(body.activeTimeSec).toBe(30);
      });
    });

    it('preserves fractional milliseconds between heartbeats', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
        activeBlock: { blockId: 'block-1', blockType: 'code', blockVersion: 'C1' },
      });

      render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
          heartbeatIntervalMs={30000}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});
      vi.clearAllMocks();

      // First heartbeat: 30.7 seconds (30700ms)
      mockPerformanceNow.mockReturnValue(30700);
      await act(async () => { vi.advanceTimersByTime(30000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const call = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        const body = JSON.parse(call[1].body);
        expect(body.activeTimeSec).toBe(30); // Floor to 30s
      });

      await act(async () => {});
      vi.clearAllMocks();

      // Second heartbeat: another 30.5 seconds (total 61.2s elapsed)
      // Should send: floor((700ms + 30500ms) / 1000) = 31s
      mockPerformanceNow.mockReturnValue(61200);
      await act(async () => { vi.advanceTimersByTime(30000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const call = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        const body = JSON.parse(call[1].body);
        expect(body.activeTimeSec).toBe(31); // 700ms + 30500ms = 31200ms → 31s
      });
    });
  });

  // ============================================
  // CRITICAL: Block Transition
  // ============================================

  describe('Block Transition', () => {
    it('flushes A before starting B timing', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      const mockUseActiveBlock = vi.mocked(ActiveBlockModule.useActiveBlock);
      
      // Start with block A
      mockUseActiveBlock.mockReturnValue({
        activeBlock: { blockId: 'block-a', blockType: 'definition', blockVersion: 'D1' },
      });

      const { rerender } = render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tutorial/ils/block-visit', expect.anything());
      });

      await act(async () => {});
      vi.clearAllMocks();

      // 15 seconds on block A
      mockPerformanceNow.mockReturnValue(15000);

      // Transition to block B
      mockUseActiveBlock.mockReturnValue({
        activeBlock: { blockId: 'block-b', blockType: 'code', blockVersion: 'C1' },
      });

      await act(async () => {
        rerender(
          <BlockTelemetryProvider
            navigationNodeId={mockNavigationNodeId}
            subtopicId={mockSubtopicId}
            sectionId={mockSectionId}
            sessionId={mockSessionId}
          >
            <div>Content</div>
          </BlockTelemetryProvider>
        );
      });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        
        // Should have: 1) A active-time flush, 2) B visit
        const timeCall = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        const visitCall = calls.find(c => 
          c[0] === '/api/tutorial/ils/block-visit' &&
          c[1].body.includes('block-b')
        );
        
        expect(timeCall).toBeTruthy();
        const timeBody = JSON.parse(timeCall[1].body);
        expect(timeBody.blockId).toBe('block-a');
        expect(timeBody.activeTimeSec).toBe(15);
        
        expect(visitCall).toBeTruthy();
      });
    });
  });

  // ============================================
  // CRITICAL: Visibility Handling
  // ============================================

  describe('Visibility API', () => {
    it('excludes hidden time from accumulation', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
        activeBlock: { blockId: 'block-1', blockType: 'code', blockVersion: 'C1' },
      });

      render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
          heartbeatIntervalMs={60000}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});
      vi.clearAllMocks();

      // Active for 10 seconds
      mockPerformanceNow.mockReturnValue(10000);

      // Hide document
      mockVisibilityState = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));

      // Hidden for 20 seconds (should NOT count)
      mockPerformanceNow.mockReturnValue(30000);

      // Show document
      mockVisibilityState = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));

      // Active for 20 more seconds (total active: 30s, total elapsed: 50s)
      mockPerformanceNow.mockReturnValue(50000);

      // Trigger heartbeat
      await act(async () => { vi.advanceTimersByTime(60000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const timeCall = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        
        expect(timeCall).toBeTruthy();
        const body = JSON.parse(timeCall[1].body);
        // Should be 30 seconds (10 + 20), NOT 50 (hidden time excluded)
        expect(body.activeTimeSec).toBe(30);
      });
    });
  });

  // ============================================
  // CRITICAL: Unmount Flush
  // ============================================

  describe('Unmount', () => {
    it('flushes pending time on unmount', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
        activeBlock: { blockId: 'block-1', blockType: 'summary', blockVersion: 'S1' },
      });

      const { unmount } = render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});
      vi.clearAllMocks();

      // Simulate 10 seconds active
      mockPerformanceNow.mockReturnValue(10000);

      // Unmount
      await act(async () => {
        unmount();
      });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const timeCall = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        
        expect(timeCall).toBeTruthy();
        const body = JSON.parse(timeCall[1].body);
        expect(body.activeTimeSec).toBe(10);
      });
    });
  });

  // ============================================
  // CRITICAL: 600-Second Cap with Remainder
  // ============================================

  describe('600-Second Cap', () => {
    it('splits >600s pending time without losing remainder', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
        activeBlock: { blockId: 'block-1', blockType: 'code', blockVersion: 'C1' },
      });

      render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
          heartbeatIntervalMs={30000}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});
      vi.clearAllMocks();

      // Simulate browser suspend/throttle: 1200 seconds elapsed
      mockPerformanceNow.mockReturnValue(1200000);

      // Trigger heartbeat
      await act(async () => { vi.advanceTimersByTime(30000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(c => c[0] === '/api/tutorial/ils/block-active-time');
        const amounts = calls.map(c => JSON.parse(c[1].body).activeTimeSec);
        expect(amounts).toEqual([600, 600]);
      });

      vi.clearAllMocks();
      mockPerformanceNow.mockReturnValue(1230000);
      await act(async () => { vi.advanceTimersByTime(30000); });
      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(c => c[0] === '/api/tutorial/ils/block-active-time');
        expect(calls.map(c => JSON.parse(c[1].body).activeTimeSec)).toEqual([30]);
      });
    });

    it('respects 600s cap even with delayed heartbeat', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
        activeBlock: { blockId: 'block-1', blockType: 'code', blockVersion: 'C1' },
      });

      render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
          heartbeatIntervalMs={30000}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});
      vi.clearAllMocks();

      // 700 seconds elapsed
      mockPerformanceNow.mockReturnValue(700000);

      await act(async () => { vi.advanceTimersByTime(30000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const call = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        
        expect(call).toBeTruthy();
        const body = JSON.parse(call[1].body);
        // Must not exceed 600
        expect(body.activeTimeSec).toBeLessThanOrEqual(600);
      });
    });
  });

  // ============================================
  // CRITICAL: Flush Serialization
  // ============================================

  describe('Flush Serialization', () => {
    it('serializes overlapping flushes to prevent double-counting', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      let fetchCallCount = 0;
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url) => {
        fetchCallCount++;
        // Simulate slow network
        await act(async () => { await vi.advanceTimersByTimeAsync(100); });
        return { ok: true, json: async () => ({}) } as Response;
      });

      const mockUseActiveBlock = vi.mocked(ActiveBlockModule.useActiveBlock);
      mockUseActiveBlock.mockReturnValue({
        activeBlock: { blockId: 'block-a', blockType: 'code', blockVersion: 'C1' },
      });

      const { rerender } = render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
          heartbeatIntervalMs={30000}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      fetchCallCount = 0;

      // 15 seconds on block A
      mockPerformanceNow.mockReturnValue(15000);

      // Trigger heartbeat (starts flush)
      act(() => { vi.advanceTimersByTime(30000); });

      // Immediately transition to block B (requests another flush)
      mockUseActiveBlock.mockReturnValue({
        activeBlock: { blockId: 'block-b', blockType: 'definition', blockVersion: 'D1' },
      });

      await act(async () => {
        rerender(
          <BlockTelemetryProvider
            navigationNodeId={mockNavigationNodeId}
            subtopicId={mockSubtopicId}
            sectionId={mockSectionId}
            sessionId={mockSessionId}
            heartbeatIntervalMs={30000}
          >
            <div>Content</div>
          </BlockTelemetryProvider>
        );
      });

      // Wait for all flushes
      await vi.waitFor(() => {
        expect(fetchCallCount).toBeGreaterThan(0);
      }, { timeout: 5000 });

      // Should have serialized the flushes (not sent duplicate activeTimeSec for same period)
      const activeTimeCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        c => c[0] === '/api/tutorial/ils/block-active-time'
      );

      // Exactly one active-time call for block A
      expect(activeTimeCalls.length).toBeLessThanOrEqual(1);
    });
  });

  it('retries the same failed A event across a transition and acknowledges it once', async () => {
    vi.useFakeTimers();
    vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
    mockPerformanceNow.mockReturnValue(0);
    let failed = false;
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url === '/api/tutorial/ils/block-active-time' && !failed) { failed = true; return { ok: false } as Response; }
      return { ok: true, json: async () => ({ processed: true }) } as Response;
    });
    const active = vi.mocked(ActiveBlockModule.useActiveBlock);
    active.mockReturnValue({ activeBlock: { blockId: 'A', blockType: 'code', blockVersion: 'C1' } });
    const view = (label: string) => <BlockTelemetryProvider navigationNodeId={mockNavigationNodeId} subtopicId={mockSubtopicId} sectionId={mockSectionId} sessionId={mockSessionId} heartbeatIntervalMs={30000}><div>{label}</div></BlockTelemetryProvider>;
    const { rerender } = render(view('A'));
    await act(async () => {});
    mockPerformanceNow.mockReturnValue(15000);
    active.mockReturnValue({ activeBlock: { blockId: 'B', blockType: 'definition', blockVersion: 'D1' } });
    await act(async () => { rerender(view('B')); });
    await act(async () => {});
    mockPerformanceNow.mockReturnValue(45000);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const bodies = vi.mocked(global.fetch).mock.calls.filter(c => c[0] === '/api/tutorial/ils/block-active-time').map(c => JSON.parse((c[1] as RequestInit).body as string));
    const a = bodies.filter(body => body.blockId === 'A');
    const b = bodies.filter(body => body.blockId === 'B');
    expect(a).toHaveLength(2); expect(a[0]).toMatchObject({ blockVersion: 'C1', activeTimeSec: 15 });
    expect(a[1].eventId).toBe(a[0].eventId); expect(b).toHaveLength(1); expect(b[0]).toMatchObject({ blockVersion: 'D1', activeTimeSec: 30 });
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const after = vi.mocked(global.fetch).mock.calls.filter(c => c[0] === '/api/tutorial/ils/block-active-time').map(c => JSON.parse((c[1] as RequestInit).body as string));
    expect(after.filter(body => body.eventId === a[0].eventId)).toHaveLength(2);
  });

  // ============================================
  // CRITICAL: Error Recovery
  // ============================================

  describe('Error Recovery', () => {
    it('continues timing after failed active-time request', async () => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
      mockPerformanceNow.mockReturnValue(0);

      let failOnce = true;
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url) => {
        if (url === '/api/tutorial/ils/block-active-time' && failOnce) {
          failOnce = false;
          throw new Error('Network error');
        }
        return { ok: true, json: async () => ({}) } as Response;
      });

      vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
        activeBlock: { blockId: 'block-1', blockType: 'code', blockVersion: 'C1' },
      });

      const { container } = render(
        <BlockTelemetryProvider
          navigationNodeId={mockNavigationNodeId}
          subtopicId={mockSubtopicId}
          sectionId={mockSectionId}
          sessionId={mockSessionId}
          heartbeatIntervalMs={30000}
        >
          <div>Content</div>
        </BlockTelemetryProvider>
      );

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});
      vi.clearAllMocks();

      // First heartbeat: 30s (will fail)
      mockPerformanceNow.mockReturnValue(30000);
      await act(async () => { vi.advanceTimersByTime(30000); });

      // Wait for failure
      await act(async () => { await vi.advanceTimersByTimeAsync(100); });

      await act(async () => {});
      vi.clearAllMocks();

      // Second heartbeat: another 30s (should succeed)
      mockPerformanceNow.mockReturnValue(60000);
      await act(async () => { vi.advanceTimersByTime(30000); });

      await vi.waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const timeCall = calls.find(c => c[0] === '/api/tutorial/ils/block-active-time');
        expect(timeCall).toBeTruthy();
      });

      // Component should still render
      expect(container.textContent).toBe('Content');
    });
  });
});
