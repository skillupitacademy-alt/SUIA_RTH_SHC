/**
 * Active Block Runtime Context
 * Phase 3: IntersectionObserver-based viewport tracking
 * 
 * DETERMINISTIC SELECTION POLICY:
 * 
 * 1. Viewport Anchor Zone: Top 25% of viewport (natural reading position)
 * 2. Selection Algorithm:
 *    - Calculate intersection of each visible block with anchor zone
 *    - Select block with highest intersection ratio in anchor zone
 *    - Tie-breaker: First block in DOM order (upward scroll preference)
 *    - No intersection: Select topmost visible block
 * 3. Edge Cases:
 *    - No blocks visible: activeBlock = null
 *    - Single block visible: that block is active
 *    - Multiple blocks: deterministic selection via anchor zone
 * 
 * ARCHITECTURAL CONSTRAINTS:
 * - Uses existing Phase 2 DOM identity (data-block-id, data-block-type, data-block-version)
 * - Does NOT introduce wrapper elements
 * - Does NOT call ILS APIs
 * - Does NOT persist state
 * - Does NOT track time or visits
 * - Does NOT render UI
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

/**
 * Active Block Identity
 * Extracted from DOM attributes (Phase 2 contract)
 */
export interface ActiveBlockIdentity {
  blockId: string;
  blockType: string;
  blockVersion?: string;
}

/**
 * Active Block State
 * null = no block is currently active
 */
export type ActiveBlockState = ActiveBlockIdentity | null;

interface ActiveBlockContextValue {
  activeBlock: ActiveBlockState;
}

const ActiveBlockContext = createContext<ActiveBlockContextValue | undefined>(undefined);

/**
 * Hook to access current active block
 * 
 * USAGE:
 * ```tsx
 * const { activeBlock } = useActiveBlock();
 * if (activeBlock) {
 *   console.log('Active:', activeBlock.blockId, activeBlock.blockType);
 * }
 * ```
 */
export function useActiveBlock(): ActiveBlockContextValue {
  const context = useContext(ActiveBlockContext);
  if (!context) {
    throw new Error('useActiveBlock must be used within ActiveBlockProvider');
  }
  return context;
}

interface ActiveBlockProviderProps {
  /**
   * Container element that holds tutorial blocks
   * Defaults to document if not provided
   */
  containerRef?: React.RefObject<HTMLElement>;
  
  /**
   * Children to render
   */
  children: React.ReactNode;
  
  /**
   * Viewport anchor position (0-1 range, default 0.25 = top 25%)
   * This is where we consider a block "active" when it intersects
   */
  anchorPosition?: number;
}

/**
 * Active Block Provider
 * 
 * LIFECYCLE:
 * 1. Mounts and queries DOM for blocks with data-block-id
 * 2. Creates single IntersectionObserver for all blocks
 * 3. Updates activeBlock state based on deterministic policy
 * 4. Cleans up observer on unmount
 * 
 * PERFORMANCE:
 * - Single observer for all blocks (not one per block)
 * - Updates only when active block actually changes
 * - Uses stable callbacks to prevent observer recreation
 */
export function ActiveBlockProvider({ 
  containerRef, 
  children,
  anchorPosition = 0.25 
}: ActiveBlockProviderProps) {
  const [activeBlock, setActiveBlock] = useState<ActiveBlockState>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleBlocksRef = useRef<Map<Element, IntersectionObserverEntry>>(new Map());
  const rafRef = useRef<number | null>(null);

  /**
   * Extract block identity from DOM element
   * Uses Phase 2 data-block-* attributes
   */
  const extractBlockIdentity = useCallback((element: Element): ActiveBlockIdentity | null => {
    const blockId = element.getAttribute('data-block-id');
    const blockType = element.getAttribute('data-block-type');
    
    if (!blockId || !blockType) {
      return null;
    }
    
    const blockVersion = element.getAttribute('data-block-version') || undefined;
    
    return { blockId, blockType, blockVersion };
  }, []);

  /**
   * Determine active block using deterministic policy
   * 
   * POLICY:
   * 1. Calculate anchor zone (top anchorPosition% of viewport)
   * 2. For each visible block, calculate intersection with anchor zone
   * 3. Select block with highest intersection
   * 4. Tie-breaker: first in DOM order
   */
  const determineActiveBlock = useCallback(() => {
    const entries = Array.from(visibleBlocksRef.current.values());
    
    // No visible blocks
    if (entries.length === 0) {
      return null;
    }

    // Viewport dimensions
    const viewportHeight = window.innerHeight;
    const anchorTop = 0;
    const anchorBottom = viewportHeight * anchorPosition;

    let bestBlock: Element | null = null;
    let bestScore = -1;

    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const rect = entry.boundingClientRect;
      
      // Calculate intersection with anchor zone
      const blockTop = rect.top;
      const blockBottom = rect.bottom;
      
      // Intersection range with anchor zone
      const intersectTop = Math.max(blockTop, anchorTop);
      const intersectBottom = Math.min(blockBottom, anchorBottom);
      const intersectionHeight = Math.max(0, intersectBottom - intersectTop);
      
      // Score: intersection height (higher = more overlap with anchor zone)
      // Secondary: negative top position (higher on screen = higher score)
      const score = intersectionHeight * 1000 - blockTop;
      
      // If this block scores better, or scores equal but comes first in DOM
      if (score > bestScore) {
        bestScore = score;
        bestBlock = entry.target;
      }
    }

    // Fallback: if no block intersects anchor, select topmost visible block
    if (!bestBlock) {
      let topmost: Element | null = null;
      let topmostY = Infinity;
      
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const y = entry.boundingClientRect.top;
        if (y < topmostY) {
          topmostY = y;
          topmost = entry.target;
        }
      }
      
      bestBlock = topmost;
    }

    if (!bestBlock) {
      return null;
    }

    return extractBlockIdentity(bestBlock);
  }, [anchorPosition, extractBlockIdentity]);

  /**
   * Update active block state (throttled via requestAnimationFrame)
   */
  const updateActiveBlock = useCallback(() => {
    // Cancel pending update
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule update
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const newActiveBlock = determineActiveBlock();
      
      // Only update if actually changed
      setActiveBlock((current) => {
        if (!current && !newActiveBlock) return current;
        if (!current || !newActiveBlock) return newActiveBlock;
        if (
          current.blockId === newActiveBlock.blockId &&
          current.blockType === newActiveBlock.blockType &&
          current.blockVersion === newActiveBlock.blockVersion
        ) {
          return current;
        }
        return newActiveBlock;
      });
    });
  }, [determineActiveBlock]);

  /**
   * IntersectionObserver callback
   */
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    // Update visible blocks map
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visibleBlocksRef.current.set(entry.target, entry);
      } else {
        visibleBlocksRef.current.delete(entry.target);
      }
    }

    // Recalculate active block
    updateActiveBlock();
  }, [updateActiveBlock]);

  /**
   * Initialize observer and observe all blocks
   */
  useEffect(() => {
    // Find container
    const container = containerRef?.current || document;
    
    // Query all blocks with Phase 2 identity
    const blocks = container.querySelectorAll('[data-block-id]');
    
    if (blocks.length === 0) {
      return;
    }

    // Create observer
    const observer = new IntersectionObserver(handleIntersection, {
      root: null, // viewport
      rootMargin: '0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0], // Multiple thresholds for smoother updates
    });

    observerRef.current = observer;

    // Observe all blocks
    blocks.forEach((block) => {
      observer.observe(block);
    });

    // Cleanup
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      observer.disconnect();
      observerRef.current = null;
      visibleBlocksRef.current.clear();
    };
  }, [containerRef, handleIntersection]);

  return (
    <ActiveBlockContext.Provider value={{ activeBlock }}>
      {children}
    </ActiveBlockContext.Provider>
  );
}

