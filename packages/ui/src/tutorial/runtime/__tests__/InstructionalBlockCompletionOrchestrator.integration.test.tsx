/**
 * Phase 2B.18 Step 1.2 - Orchestrator Integration Certification Tests
 * 
 * PURPOSE:
 * Runtime verification of orchestrator behaviors D, E, F, I using actual
 * production provider composition.
 * 
 * CONSTRAINTS:
 * - Use existing provider composition (ILSProvider + mock ActiveBlock)
 * - Mock only at service/network boundary (fetch + ActiveBlockContext)
 * - Database-free (mocked fetch)
 * - Evidence-based (concrete runtime proof)
 * 
 * TESTS:
 * D — Duplicate success suppression
 * E — Cross-navigation identity isolation
 * F — In-flight duplicate prevention (CRITICAL)
 * I — Retry frequency behavior
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import { InstructionalBlockCompletionOrchestrator } from '../InstructionalBlockCompletionOrchestrator';
import { ILSProvider, useILS } from '../ILSProvider';
import * as ActiveBlockModule from '../ActiveBlockContext';
import * as tutorialTrackingService from '../../../../../../src/share-branding/LearningExperience/runtime/tutorialTrackingService';
import type { ActiveBlockIdentity } from '../ActiveBlockContext';

// Mock ActiveBlockContext
vi.mock('../ActiveBlockContext', async () => {
  const actual = await vi.importActual<typeof ActiveBlockModule>('../ActiveBlockContext');
  return {
    ...actual,
    useActiveBlock: vi.fn(() => ({ activeBlock: null })),
  };
});

// Mock tutorialTrackingService
vi.mock('../../../../../../src/share-branding/LearningExperience/runtime/tutorialTrackingService', () => ({
  markBlockComplete: vi.fn(),
  trackTutorialEvent: vi.fn(),
}));

// ═══════════════════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

const createBlockMetadata = (blockId: string = 'block-1', blockVersion: string = 'D1') => ({
  progressRole: 'instructional' as const,
  expectedTimeSec: 100,
});

// Explicit fixture type to allow completedAt mutation in tests
type MockProgressResponse = {
  data: {
    navigationNodeId: string;
    sectionId: string;
    subtopicId: string;
    status: 'in_progress';
    progressPercentage: number;
    completedBlockCount: number;
    totalBlockCount: number;
    timeSpentActiveSec: number;
    visitCount: number;
    revisionCount: number;
    firstViewedAt: string;
    lastViewedAt: string;
    completedAt: string | null;
    blocks: Array<{
      blockId: string;
      blockVersion: string;
      visitCount: number;
      revisionCount: number;
      activeTimeSec: number;
      expectedTimeSec: number;
      firstViewedAt: string;
      lastViewedAt: string;
      completedAt: string | null;
    }>;
  };
};

const createMockProgressResponse = (navigationNodeId: string): MockProgressResponse => ({
  data: {
    navigationNodeId,
    sectionId: 'section-1',
    subtopicId: 'subtopic-1',
    status: 'in_progress' as const,
    progressPercentage: 50,
    completedBlockCount: 0,
    totalBlockCount: 1,
    timeSpentActiveSec: 80,
    visitCount: 1,
    revisionCount: 0,
    firstViewedAt: '2026-09-27T10:00:00.000Z',
    lastViewedAt: '2026-09-27T10:01:00.000Z',
    completedAt: null,
    blocks: [
      {
        blockId: 'block-1',
        blockVersion: 'D1',
        visitCount: 1,
        revisionCount: 0,
        activeTimeSec: 80,
        expectedTimeSec: 100,
        firstViewedAt: '2026-09-27T10:00:00.000Z',
        lastViewedAt: '2026-09-27T10:01:00.000Z',
        completedAt: null,
      },
    ],
  },
});

const createActiveBlock = (
  blockId: string = 'block-1',
  blockVersion: string = 'D1'
): ActiveBlockIdentity => ({
  blockId,
  blockType: 'definition',
  blockVersion,
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase 2B.18 Step 1.2 - Orchestrator Integration Certification', () => {
  let markBlockCompleteMock: ReturnType<typeof vi.mocked<typeof tutorialTrackingService.markBlockComplete>>;
  let useActiveBlockMock: ReturnType<typeof vi.mocked<typeof ActiveBlockModule.useActiveBlock>>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    markBlockCompleteMock = vi.mocked(tutorialTrackingService.markBlockComplete);
    useActiveBlockMock = vi.mocked(ActiveBlockModule.useActiveBlock);
    
    // Mock fetch for ILS API
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST D: DUPLICATE SUCCESS SUPPRESSION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST D: Duplicate Success Suppression', () => {
    it('D1: Single POST for successful completion despite multiple evaluations', async () => {
      // Setup: Mock successful delivery
      markBlockCompleteMock.mockResolvedValue({ delivered: true });
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      let fetchCallCount = 0;
      let blockCompletedAt: string | null = null;
      
      // Return DIFFERENT activeBlockProgress on each fetch
      // After first completion succeeds, mark block as complete
      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        const response = createMockProgressResponse('page-a');
        response.data.timeSpentActiveSec = 80 + fetchCallCount;
        response.data.blocks[0].activeTimeSec = 80 + fetchCallCount;
        
        // Simulate backend marking block complete after first successful delivery
        if (markBlockCompleteMock.mock.calls.length >= 1) {
          blockCompletedAt = '2026-09-27T10:02:00.000Z';
        }
        response.data.blocks[0].completedAt = blockCompletedAt;
        
        return Promise.resolve({
          ok: true,
          json: async () => response,
        } as Response);
      });

      const activeBlock = createActiveBlock('block-1', 'D1');
      useActiveBlockMock.mockReturnValue({ activeBlock });

      const TestComponent = () => {
        const [refreshKey, setRefreshKey] = React.useState(0);

        // Force second ILS fetch → new activeBlockProgress → second evaluation
        React.useEffect(() => {
          if (refreshKey === 0) {
            const timer = setTimeout(() => {
              setRefreshKey(1);
            }, 300);
            return () => clearTimeout(timer);
          }
        }, [refreshKey]);

        return (
          <ILSProvider 
            key={refreshKey}
            navigationNodeId="page-a" 
            subtopicId="subtopic-1" 
            sectionId="section-1"
          >
            <InstructionalBlockCompletionOrchestrator
              navigationNodeId="page-a"
              subtopicId="subtopic-1"
              sectionId="section-1"
              resolveBlockMetadata={createBlockMetadata}
              enabled={true}
            >
              <div>Test Content</div>
            </InstructionalBlockCompletionOrchestrator>
          </ILSProvider>
        );
      };

      render(<TestComponent />);

      // Wait for first completion
      await waitFor(() => expect(markBlockCompleteMock).toHaveBeenCalledTimes(1), { timeout: 500 });

      // Wait for second ILS fetch (refreshKey changes)
      await waitFor(() => expect(fetchCallCount).toBeGreaterThanOrEqual(2), { timeout: 1000 });

      // Wait to see if second evaluation triggers duplicate POST
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });

      // Assert: Only ONE completion POST
      // Second evaluation sees completedAt != null, orchestrator skips
      expect(markBlockCompleteMock).toHaveBeenCalledTimes(1);

      // Verify correct block
      expect(markBlockCompleteMock).toHaveBeenCalledWith(
        '',
        'subtopic-1',
        'page-a',
        'section-1',
        'block-1',
        'definition',
        'D1'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST E: CROSS-NAVIGATION IDENTITY ISOLATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST E: Cross-Navigation Identity Isolation', () => {
    it('E1: Same block on different pages produces independent completions', async () => {
      markBlockCompleteMock.mockResolvedValue({ delivered: true });
      
      const activeBlock = createActiveBlock('block-1', 'D1');
      useActiveBlockMock.mockReturnValue({ activeBlock });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      
      // Mock fetch to return appropriate response based on URL
      mockFetch.mockImplementation((url: string) => {
        const urlStr = url.toString();
        const navigationNodeId = urlStr.includes('page-b') ? 'page-b' : 'page-a';
        
        return Promise.resolve({
          ok: true,
          json: async () => createMockProgressResponse(navigationNodeId),
        } as Response);
      });

      const TestComponent = () => {
        const [currentPage, setCurrentPage] = React.useState('page-a');

        // Switch to page-b after initial render
        React.useEffect(() => {
          const timer = setTimeout(() => {
            setCurrentPage('page-b');
          }, 300);
          return () => clearTimeout(timer);
        }, []);

        return (
          <ILSProvider navigationNodeId={currentPage} subtopicId="subtopic-1" sectionId="section-1">
            <InstructionalBlockCompletionOrchestrator
              navigationNodeId={currentPage}
              subtopicId="subtopic-1"
              sectionId="section-1"
              resolveBlockMetadata={createBlockMetadata}
              enabled={true}
            >
              <div>Page: {currentPage}</div>
            </InstructionalBlockCompletionOrchestrator>
          </ILSProvider>
        );
      };

      render(<TestComponent />);

      // Wait for both completions (page change triggers ILS reload → new activeBlockProgress → orchestrator re-evaluates)
      await waitFor(() => expect(markBlockCompleteMock).toHaveBeenCalledTimes(2), { timeout: 1500 });

      // Verify page-a completion
      expect(markBlockCompleteMock).toHaveBeenNthCalledWith(
        1,
        '',
        'subtopic-1',
        'page-a',
        'section-1',
        'block-1',
        'definition',
        'D1'
      );

      // Verify page-b completion
      expect(markBlockCompleteMock).toHaveBeenNthCalledWith(
        2,
        '',
        'subtopic-1',
        'page-b',
        'section-1',
        'block-1',
        'definition',
        'D1'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST F: IN-FLIGHT DUPLICATE PREVENTION (CRITICAL)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST F: In-Flight Duplicate Prevention', () => {
    it('F1: Concurrent evaluations produce single POST (CRITICAL RUNTIME VERIFICATION)', async () => {
      let resolveFirstCompletion: ((value: any) => void) | null = null;
      let completionCallCount = 0;
      
      // Create controlled completion promises
      markBlockCompleteMock.mockImplementation(async () => {
        completionCallCount++;
        console.log(`[F1 TEST] markBlockComplete call #${completionCallCount}`);
        
        if (completionCallCount === 1) {
          // First call: return pending promise that we control
          return new Promise((resolve) => {
            resolveFirstCompletion = resolve;
            console.log('[F1 TEST] First completion promise created (PENDING)');
          });
        }
        // Second call (if it happens): immediate success
        console.log('[F1 TEST] Second completion attempt - THIS SHOULD NOT HAPPEN');
        return { delivered: true };
      });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      let fetchCallCount = 0;
      let currentMockResponse = createMockProgressResponse('page-a');
      currentMockResponse.data.timeSpentActiveSec = 81;
      currentMockResponse.data.blocks[0].activeTimeSec = 81;
      
      // Mock returns the current response object
      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        console.log(`[F1 TEST] ILS fetch #${fetchCallCount}, activeTimeSec: ${currentMockResponse.data.blocks[0].activeTimeSec}`);
        
        return Promise.resolve({
          ok: true,
          json: async () => currentMockResponse,
        } as Response);
      });

      const activeBlock = createActiveBlock('block-1', 'D1');
      useActiveBlockMock.mockReturnValue({ activeBlock });

      // Controller to access refresh() from inside ILSProvider
      let refreshFn: (() => Promise<void>) | null = null;
      const RefreshController = () => {
        const { refresh } = useILS();
        
        React.useEffect(() => {
          refreshFn = refresh;
          console.log('[F1 TEST] refresh() function captured');
        }, [refresh]);
        
        return null;
      };

      // Render with SINGLE provider instance - no key prop
      render(
        <ILSProvider 
          navigationNodeId="page-a" 
          subtopicId="subtopic-1" 
          sectionId="section-1"
        >
          <RefreshController />
          <InstructionalBlockCompletionOrchestrator
            navigationNodeId="page-a"
            subtopicId="subtopic-1"
            sectionId="section-1"
            resolveBlockMetadata={createBlockMetadata}
            enabled={true}
          >
            <div>Test Content</div>
          </InstructionalBlockCompletionOrchestrator>
        </ILSProvider>
      );

      // Wait for first ILS fetch and first markBlockComplete call
      await waitFor(() => expect(markBlockCompleteMock).toHaveBeenCalledTimes(1), { timeout: 500 });
      
      console.log('[F1 TEST] === CHECKPOINT: First completion started ===');
      console.log('[F1 TEST] Fetch count:', fetchCallCount);
      console.log('[F1 TEST] Completion count:', completionCallCount);
      console.log('[F1 TEST] First completion status: PENDING');

      // CRITICAL: At this point, first completion is PENDING
      // inFlightAttemptsRef should contain: "page-a:block-1:D1"
      
      // Prepare SECOND progress object with different activeTimeSec
      // SAME identity: page-a, block-1, D1
      // DIFFERENT progress: 82 seconds instead of 81
      currentMockResponse = createMockProgressResponse('page-a');
      currentMockResponse.data.timeSpentActiveSec = 82;
      currentMockResponse.data.blocks[0].activeTimeSec = 82;
      
      console.log('[F1 TEST] === TRIGGER: Invoking refresh() while first completion PENDING ===');
      
      // Invoke the REAL provider refresh() API
      // This will:
      // 1. Call fetchProgress() → mock returns NEW progress object (82 sec)
      // 2. Call updateActiveBlockProgress() → new activeBlockProgress emitted
      // 3. Orchestrator's useEffect([activeBlockProgress]) should trigger
      // 4. Orchestrator evaluates AGAIN with new progress
      // 5. inFlightAttemptsRef.has("page-a:block-1:D1") should be TRUE
      // 6. Second completion attempt should be SUPPRESSED
      
      await act(async () => {
        if (!refreshFn) {
          throw new Error('[F1 TEST] refresh() function not captured');
        }
        await refreshFn();
      });

      console.log('[F1 TEST] === CHECKPOINT: After refresh() ===');
      console.log('[F1 TEST] Fetch count:', fetchCallCount);
      console.log('[F1 TEST] Completion count:', completionCallCount);
      
      // Wait for any potential second evaluation to process
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // CRITICAL ASSERTION: Only ONE POST while first is pending
      const callCountWhilePending = markBlockCompleteMock.mock.calls.length;
      
      console.log('[F1 TEST] === ASSERTION: While first completion PENDING ===');
      console.log('[F1 TEST] Expected POST count: 1');
      console.log('[F1 TEST] Actual POST count:', callCountWhilePending);
      
      if (callCountWhilePending > 1) {
        console.error('[F1 TEST] FAILURE: Second evaluation triggered duplicate POST');
        console.error('[F1 TEST] This means inFlightAttemptsRef did NOT prevent concurrent evaluation');
      }
      
      expect(callCountWhilePending).toBe(1);

      // Now resolve the first completion
      console.log('[F1 TEST] === RESOLVE: First completion ===');
      
      await act(async () => {
        if (resolveFirstCompletion) {
          resolveFirstCompletion({ delivered: true });
          console.log('[F1 TEST] First completion resolved with success');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // CRITICAL ASSERTION: Still only ONE POST total after resolution
      const finalCallCount = markBlockCompleteMock.mock.calls.length;
      
      console.log('[F1 TEST] === FINAL ASSERTION ===');
      console.log('[F1 TEST] Total fetch count:', fetchCallCount);
      console.log('[F1 TEST] Total POST count:', finalCallCount);
      console.log('[F1 TEST] Expected: 2 fetches, 1 POST');
      
      // Verify we actually had 2 fetches (proving second evaluation occurred)
      expect(fetchCallCount).toBeGreaterThanOrEqual(2);
      
      // Verify only 1 completion POST (proving in-flight protection worked)
      expect(finalCallCount).toBe(1);
      
      console.log('[F1 TEST] ✅ F1 VERIFIED: In-flight duplicate prevention working');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST I: RETRY FREQUENCY BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST I: Retry Frequency Behavior', () => {
    it('I1: Failed delivery allows retry on next legitimate evaluation', async () => {
      // First attempt: failure
      // Second attempt: success
      markBlockCompleteMock
        .mockResolvedValueOnce({ delivered: false, reason: 'http' })
        .mockResolvedValueOnce({ delivered: true });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      let fetchCallCount = 0;
      
      // Return updated progress on each fetch (simulates ILS state changes)
      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        const response = createMockProgressResponse('page-a');
        // Modify timeSpentActiveSec to create distinct activeBlockProgress objects
        response.data.timeSpentActiveSec = 80 + fetchCallCount;
        response.data.blocks[0].activeTimeSec = 80 + fetchCallCount;
        
        return Promise.resolve({
          ok: true,
          json: async () => response,
        } as Response);
      });

      const activeBlock = createActiveBlock('block-1', 'D1');
      useActiveBlockMock.mockReturnValue({ activeBlock });

      const TestComponent = () => {
        const [refreshKey, setRefreshKey] = React.useState(0);

        // Force ILS to refetch by changing provider key (simulates legitimate state change)
        React.useEffect(() => {
          if (refreshKey === 0) {
            const timer = setTimeout(() => {
              setRefreshKey(1);
            }, 300);
            return () => clearTimeout(timer);
          }
        }, [refreshKey]);

        return (
          <ILSProvider 
            key={refreshKey} 
            navigationNodeId="page-a" 
            subtopicId="subtopic-1" 
            sectionId="section-1"
          >
            <InstructionalBlockCompletionOrchestrator
              navigationNodeId="page-a"
              subtopicId="subtopic-1"
              sectionId="section-1"
              resolveBlockMetadata={createBlockMetadata}
              enabled={true}
            >
              <div>Attempt: {refreshKey}</div>
            </InstructionalBlockCompletionOrchestrator>
          </ILSProvider>
        );
      };

      render(<TestComponent />);

      // Wait for both attempts (ILS refetch triggers new activeBlockProgress → orchestrator re-evaluates)
      await waitFor(() => expect(markBlockCompleteMock).toHaveBeenCalledTimes(2), { timeout: 1500 });

      // Verify first attempt (failure)
      const firstResult = await markBlockCompleteMock.mock.results[0].value;
      expect(firstResult).toEqual({ delivered: false, reason: 'http' });

      // Verify second attempt (retry, success)
      const secondResult = await markBlockCompleteMock.mock.results[1].value;
      expect(secondResult).toEqual({ delivered: true });
    });

    it('I2: Rapid state changes do not create uncontrolled request storm', async () => {
      // All attempts fail
      markBlockCompleteMock.mockResolvedValue({ delivered: false, reason: 'network' });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      let fetchCallCount = 0;
      
      // Return DIFFERENT activeBlockProgress on each fetch
      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        const response = createMockProgressResponse('page-a');
        response.data.timeSpentActiveSec = 80 + fetchCallCount;
        response.data.blocks[0].activeTimeSec = 80 + fetchCallCount;
        return Promise.resolve({
          ok: true,
          json: async () => response,
        } as Response);
      });

      const activeBlock = createActiveBlock('block-1', 'D1');
      useActiveBlockMock.mockReturnValue({ activeBlock });

      const TestComponent = () => {
        const [refreshCount, setRefreshCount] = React.useState(0);

        // Rapid ILS refetches (5 times)
        React.useEffect(() => {
          if (refreshCount < 5) {
            const timer = setTimeout(() => {
              setRefreshCount(refreshCount + 1);
            }, 50);
            return () => clearTimeout(timer);
          }
        }, [refreshCount]);

        return (
          <ILSProvider 
            key={refreshCount}
            navigationNodeId="page-a" 
            subtopicId="subtopic-1" 
            sectionId="section-1"
          >
            <InstructionalBlockCompletionOrchestrator
              navigationNodeId="page-a"
              subtopicId="subtopic-1"
              sectionId="section-1"
              resolveBlockMetadata={createBlockMetadata}
              enabled={true}
            >
              <div>Refresh: {refreshCount}</div>
            </InstructionalBlockCompletionOrchestrator>
          </ILSProvider>
        );
      };

      render(<TestComponent />);

      // Wait for refetches to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      // Assert: Request count should be bounded
      const callCount = markBlockCompleteMock.mock.calls.length;
      
      // Should be >= 1 (at least one attempt)
      // Should be <= 6 (not unbounded recursive loop - 6 allows for initial + 5 refreshes)
      expect(callCount).toBeGreaterThanOrEqual(1);
      expect(callCount).toBeLessThanOrEqual(6);
    });

    it('I3: Successful delivery stops further retry attempts', async () => {
      let completionCallCount = 0;
      
      // Mock to track calls and return appropriate responses
      markBlockCompleteMock.mockImplementation(async () => {
        completionCallCount++;
        if (completionCallCount === 1) {
          return { delivered: false, reason: 'http' };
        }
        return { delivered: true };
      });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      let fetchCallCount = 0;
      let blockCompletedAt: string | null = null;
      
      // Return updated progress on each fetch
      // After second completion attempt succeeds, block shows as completed
      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        const response = createMockProgressResponse('page-a');
        response.data.timeSpentActiveSec = 80 + fetchCallCount;
        response.data.blocks[0].activeTimeSec = 80 + fetchCallCount;
        
        // After successful delivery (completionCallCount >= 2), mark block complete
        if (completionCallCount >= 2) {
          blockCompletedAt = '2026-09-27T10:02:00.000Z';
        }
        response.data.blocks[0].completedAt = blockCompletedAt;
        
        return Promise.resolve({
          ok: true,
          json: async () => response,
        } as Response);
      });

      const activeBlock = createActiveBlock('block-1', 'D1');
      useActiveBlockMock.mockReturnValue({ activeBlock });

      const TestComponent = () => {
        const [refreshKey, setRefreshKey] = React.useState(0);

        // Force 3 ILS refreshes
        React.useEffect(() => {
          if (refreshKey < 2) {
            const timer = setTimeout(() => {
              setRefreshKey(refreshKey + 1);
            }, 300);
            return () => clearTimeout(timer);
          }
        }, [refreshKey]);

        return (
          <ILSProvider 
            key={refreshKey} 
            navigationNodeId="page-a" 
            subtopicId="subtopic-1" 
            sectionId="section-1"
          >
            <InstructionalBlockCompletionOrchestrator
              navigationNodeId="page-a"
              subtopicId="subtopic-1"
              sectionId="section-1"
              resolveBlockMetadata={createBlockMetadata}
              enabled={true}
            >
              <div>Eval: {refreshKey}</div>
            </InstructionalBlockCompletionOrchestrator>
          </ILSProvider>
        );
      };

      render(<TestComponent />);

      // Wait for completion (first attempt fails, second succeeds)
      await waitFor(() => expect(markBlockCompleteMock).toHaveBeenCalledTimes(2), { timeout: 1500 });

      // Wait for third ILS refresh
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      // Assert: Only 2 POSTs (failure + success)
      // Third refresh sees completedAt != null, orchestrator skips evaluation
      expect(markBlockCompleteMock).toHaveBeenCalledTimes(2);
    });
  });
});
