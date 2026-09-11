/**
 * ILS Provider - Phase 4 Data Context Layer
 * 
 * PURPOSE:
 * Bridges ActiveBlockContext → ILS API to provide learning progress data
 * for the future Phase 5 ILS Right Sidebar UI.
 * 
 * PHASE 4 SCOPE:
 * - Data context layer ONLY
 * - NO visual UI components
 * - NO cards, progress bars, or display elements
 * 
 * ARCHITECTURE:
 * ```
 * ActiveBlockContext (Phase 3)
 *         ↓
 *   ILSProvider (Phase 4) ← navigationNodeId, subtopicId
 *         ↓
 *     ILS API
 *         ↓
 *   Navigation Progress + Block Completion Data
 * ```
 * 
 * DATA CONTRACT:
 * - Overall Progress: navigation-level metrics (visitCount, timeSpent, etc.)
 * - Active Block Progress: completion status for currently visible block
 * 
 * CURRENT API LIMITATIONS (Phase 4):
 * ✅ Available: navigation-level progress, block completion status
 * ❌ Not available: per-block visitCount, per-block activeTimeSec, timeComparison
 * 
 * Phase 5 UI must handle these gaps gracefully.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useActiveBlock, type ActiveBlockIdentity } from './ActiveBlockContext';

/**
 * Learning state values
 */
export type LearningState = 
  | 'not_started'   
  | 'in_progress'   
  | 'completed'     
  | 'not_available';

/**
 * Overall Progress
 * Navigation-level metrics for the current tutorial page
 */
export interface ILSOverallProgress {
  status: LearningState;
  progressPercentage: number; // 0-100
  completedBlockCount: number;
  totalBlockCount: number;
  visitCount: number;
  revisionCount: number;
  timeSpentActiveSec: number;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Active Block Progress
 * Completion status for the currently visible block
 * 
 * Gate 3C.1R: Now includes per-block telemetry metrics from block_learning_state
 */
export interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion: string;
  isCompleted: boolean;
  completedAt: Date | null;
  
  // Gate 3C.1R: Block-level telemetry metrics
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
}

/**
 * ILS Context Value
 * Exposed to components via useILS() hook
 */
export interface ILSContextValue {
  // Navigation context
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  
  // Progress data
  overallProgress: ILSOverallProgress | null;
  activeBlockProgress: ILSActiveBlockProgress | null;
  
  // State
  loading: boolean;
  error: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
}

const ILSContext = createContext<ILSContextValue | undefined>(undefined);

/**
 * Hook to access ILS data
 * 
 * USAGE:
 * ```tsx
 * const { overallProgress, activeBlockProgress, loading } = useILS();
 * 
 * if (loading) return <Skeleton />;
 * if (overallProgress) {
 *   console.log(`Progress: ${overallProgress.progressPercentage}%`);
 * }
 * ```
 */
export function useILS(): ILSContextValue {
  const context = useContext(ILSContext);
  if (!context) {
    throw new Error('useILS must be used within ILSProvider');
  }
  return context;
}

/**
 * Completed Block Record (from API)
 */
interface CompletedBlockRecord {
  blockId: string;
  blockVersion: string;
  completedAt: string; // ISO timestamp
}

/**
 * Block Learning State from API (Gate 3C.1R)
 */
interface BlockLearningStateResponse {
  blockId: string;
  blockVersion: string;
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
}

/**
 * Navigation Progress Response (from API)
 * 
 * Gate 3C.1R: Now includes per-block telemetry metrics
 */
interface NavigationProgressResponse {
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId: string;
  status: LearningState;
  progressPercentage: number;
  completedBlocks: CompletedBlockRecord[];
  completedBlockCount: number;
  totalBlockCount: number;
  blocks: BlockLearningStateResponse[]; // Gate 3C.1R: Per-block telemetry
  timeSpentActiveSec: number;
  visitCount: number;
  revisionCount: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
}

interface ILSProviderProps {
  /**
   * Navigation node ID (from navigation hierarchy)
   * This is the canonical page identifier
   */
  navigationNodeId: string;
  
  /**
   * Subtopic ID (from navigation hierarchy)
   * Required for API hierarchy validation
   */
  subtopicId: string;
  
  /**
   * Section ID (optional, from content structure)
   */
  sectionId?: string | null;
  
  /**
   * Children to render
   */
  children: React.ReactNode;
}

/**
 * ILS Provider
 * 
 * LIFECYCLE:
 * 1. Mounts with navigationNodeId + subtopicId from page context
 * 2. Calls GET /api/tutorial/ils/navigation/:nodeId to fetch progress
 * 3. Subscribes to ActiveBlockContext for currently visible block
 * 4. Derives activeBlockProgress from completedBlocks[] array
 * 5. Exposes data via useILS() hook
 * 
 * AUTHENTICATION:
 * - Uses existing authenticated session (cookie or Bearer token)
 * - BFF handles auth verification and brand context
 * 
 * ERROR HANDLING:
 * - 401: Authentication required → sets error state
 * - 404: Navigation node not found → sets error state
 * - 500: Server error → sets error state
 * - Network error → sets error state
 */
export function ILSProvider({
  navigationNodeId,
  subtopicId,
  sectionId = null,
  children,
}: ILSProviderProps) {
  const { activeBlock } = useActiveBlock();
  
  const [overallProgress, setOverallProgress] = useState<ILSOverallProgress | null>(null);
  const [activeBlockProgress, setActiveBlockProgress] = useState<ILSActiveBlockProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Store blocks in ref to avoid re-fetching on active block changes
   * Gate 3C.1R: Changed from completedBlocks to full block telemetry state
   */
  const blocksRef = React.useRef<BlockLearningStateResponse[] | null>(null);
  
  /**
   * Track current page identity to prevent stale responses from old pages
   */
  const currentPageIdentityRef = React.useRef({ navigationNodeId, subtopicId });
  
  /**
   * Fetch navigation progress from ILS API
   */
  const fetchProgress = useCallback(async () => {
    // Capture page identity at request time
    const requestIdentity = { navigationNodeId, subtopicId };
    
    try {
      setLoading(true);
      setError(null);
      
      // Call BFF endpoint (works for both SkillUp and RTH)
      const url = `/api/tutorial/ils/navigation/${navigationNodeId}?subtopicId=${subtopicId}`;
      
      console.log('[ILSProvider] fetchProgress - starting request', { url });
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[ILSProvider] fetchProgress - response received', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 404) {
          throw new Error('Navigation node not found');
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch progress: ${response.status}`);
      }
      
      // Unwrap the API response wrapper: { data: NavigationProgressResponse }
      const responseBody = await response.json();
      const data: NavigationProgressResponse = responseBody.data;
      
      console.log('[ILSProvider] fetchProgress - data parsed', {
        hasBlocks: !!data.blocks,
        blocksCount: data.blocks?.length,
        navigationNodeId: data.navigationNodeId,
      });
      
      // CRITICAL: Verify this response still belongs to current page
      if (
        currentPageIdentityRef.current.navigationNodeId !== requestIdentity.navigationNodeId ||
        currentPageIdentityRef.current.subtopicId !== requestIdentity.subtopicId
      ) {
        // Stale response - page changed while request was pending
        console.warn('[ILSProvider] Discarding stale response for', requestIdentity);
        return null;
      }
      
      // Map API response to ILSOverallProgress
      setOverallProgress({
        status: data.status,
        progressPercentage: data.progressPercentage,
        completedBlockCount: data.completedBlockCount,
        totalBlockCount: data.totalBlockCount,
        visitCount: data.visitCount,
        revisionCount: data.revisionCount,
        timeSpentActiveSec: data.timeSpentActiveSec,
        firstViewedAt: data.firstViewedAt ? new Date(data.firstViewedAt) : null,
        lastViewedAt: data.lastViewedAt ? new Date(data.lastViewedAt) : null,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
      });
      
      // Store completed blocks for active block lookup
      return data.blocks; // Gate 3C.1R: Return blocks instead of completedBlocks
      
    } catch (err) {
      // Verify error still belongs to current page
      if (
        currentPageIdentityRef.current.navigationNodeId !== requestIdentity.navigationNodeId ||
        currentPageIdentityRef.current.subtopicId !== requestIdentity.subtopicId
      ) {
        // Stale error - discard
        return null;
      }
      
      const error = err instanceof Error ? err : new Error('Failed to fetch ILS progress');
      setError(error);
      console.error('[ILSProvider] fetchProgress error:', error);
      return null;
    } finally {
      // Only update loading state if still current page
      if (
        currentPageIdentityRef.current.navigationNodeId === requestIdentity.navigationNodeId &&
        currentPageIdentityRef.current.subtopicId === requestIdentity.subtopicId
      ) {
        setLoading(false);
      }
    }
  }, [navigationNodeId, subtopicId]);
  
  /**
   * Derive active block progress from blocks array
   * Gate 3C.1R: Now uses full block telemetry state instead of just completedBlocks
   */
  const updateActiveBlockProgress = useCallback(
    (activeBlock: ActiveBlockIdentity | null, blocks: BlockLearningStateResponse[] | null) => {
      console.log('[ILSProvider] updateActiveBlockProgress called', {
        hasActiveBlock: !!activeBlock,
        activeBlock,
        hasBlocks: !!blocks,
        blocksCount: blocks?.length,
      });
      
      if (!activeBlock || !blocks) {
        console.log('[ILSProvider] Setting activeBlockProgress to null (no activeBlock or blocks)');
        setActiveBlockProgress(null);
        return;
      }
      
      // Find matching block by blockId + blockVersion
      // STRICT MATCHING: Both blockId AND blockVersion must match
      const blockState = blocks.find(
        (block) =>
          block.blockId === activeBlock.blockId &&
          block.blockVersion === activeBlock.blockVersion
      );
      
      console.log('[ILSProvider] Block matching result', {
        found: !!blockState,
        activeBlockId: activeBlock.blockId,
        activeBlockVersion: activeBlock.blockVersion,
        blockState,
      });
      
      if (blockState) {
        // Block has telemetry state - map all fields
        setActiveBlockProgress({
          blockId: activeBlock.blockId,
          blockType: activeBlock.blockType,
          blockVersion: activeBlock.blockVersion || '',
          isCompleted: !!blockState.completedAt,
          completedAt: blockState.completedAt ? new Date(blockState.completedAt) : null,
          visitCount: blockState.visitCount,
          revisionCount: blockState.revisionCount,
          activeTimeSec: blockState.activeTimeSec,
          expectedTimeSec: blockState.expectedTimeSec,
          firstViewedAt: blockState.firstViewedAt ? new Date(blockState.firstViewedAt) : null,
          lastViewedAt: blockState.lastViewedAt ? new Date(blockState.lastViewedAt) : null,
        });
      } else {
        // No telemetry record yet - zero/default semantics
        setActiveBlockProgress({
          blockId: activeBlock.blockId,
          blockType: activeBlock.blockType,
          blockVersion: activeBlock.blockVersion || '',
          isCompleted: false,
          completedAt: null,
          visitCount: 0,
          revisionCount: 0,
          activeTimeSec: 0,
          expectedTimeSec: null,
          firstViewedAt: null,
          lastViewedAt: null,
        });
      }
    },
    []
  );
  
  /**
   * Store activeBlock in ref to access current value in async callbacks
   */
  const activeBlockRef = React.useRef(activeBlock);
  
  useEffect(() => {
    activeBlockRef.current = activeBlock;
  }, [activeBlock]);

  /**
   * Initial fetch on mount - only depends on navigation identity
   */
  useEffect(() => {
    let isMounted = true;
    
    // Update current page identity
    currentPageIdentityRef.current = { navigationNodeId, subtopicId };
    
    // CRITICAL: Clear old cached blocks when page changes
    blocksRef.current = null;
    setActiveBlockProgress(null);
    
    fetchProgress().then((blocks) => {
      if (isMounted && blocks) {
        console.log('[ILSProvider] fetchProgress completed', {
          blocksCount: blocks.length,
          activeBlockRefValue: activeBlockRef.current,
          willCallUpdate: !!activeBlockRef.current,
        });
        blocksRef.current = blocks;
        // Use current activeBlock from ref, not captured closure value
        updateActiveBlockProgress(activeBlockRef.current, blocks);
      }
    });
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationNodeId, subtopicId]); // Only refetch when page identity changes
  
  /**
   * Update active block progress when activeBlock changes
   * Uses stored completedBlocks to avoid refetching navigation progress
   */
  useEffect(() => {
    console.log('[ILSProvider] activeBlock changed effect', {
      hasBlocksRef: !!blocksRef.current,
      hasActiveBlock: !!activeBlock,
      activeBlock,
    });
    
    if (blocksRef.current && activeBlock) {
      updateActiveBlockProgress(activeBlock, blocksRef.current);
    } else if (!activeBlock) {
      console.log('[ILSProvider] No active block - setting activeBlockProgress to null');
      setActiveBlockProgress(null);
    }
  }, [activeBlock, updateActiveBlockProgress]);
  
  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    const blocks = await fetchProgress();
    if (blocks) {
      blocksRef.current = blocks;
      updateActiveBlockProgress(activeBlock, blocks);
    }
  }, [fetchProgress, activeBlock, updateActiveBlockProgress]);
  
  const contextValue: ILSContextValue = {
    navigationNodeId,
    subtopicId,
    sectionId,
    overallProgress,
    activeBlockProgress,
    loading,
    error,
    refresh,
  };
  
  return <ILSContext.Provider value={contextValue}>{children}</ILSContext.Provider>;
}
