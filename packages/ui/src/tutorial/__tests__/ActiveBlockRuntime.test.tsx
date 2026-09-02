/**
 * Active Block Runtime Tests
 * Phase 3: Comprehensive test coverage for IntersectionObserver-based active block detection
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { ActiveBlockProvider, useActiveBlock } from '../runtime/ActiveBlockContext';

/**
 * Mock IntersectionObserver
 */
let mockObserverCallback: IntersectionObserverCallback | null = null;
let mockObserverInstance: any = null;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    mockObserverCallback = callback;
    mockObserverInstance = this;
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

beforeEach(() => {
  global.IntersectionObserver = MockIntersectionObserver as any;
  mockObserverCallback = null;
  mockObserverInstance = null;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => {
    cb();
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Test Component
 */
function TestConsumer() {
  const { activeBlock } = useActiveBlock();
  return (
    <div data-testid="active-block-consumer">
      {activeBlock ? (
        <div>
          <span data-testid="active-block-id">{activeBlock.blockId}</span>
          <span data-testid="active-block-type">{activeBlock.blockType}</span>
          {activeBlock.blockVersion && (
            <span data-testid="active-block-version">{activeBlock.blockVersion}</span>
          )}
        </div>
      ) : (
        <span data-testid="no-active-block">No active block</span>
      )}
    </div>
  );
}

/**
 * Helper: Create mock IntersectionObserverEntry
 */
function createMockEntry(
  element: Element,
  isIntersecting: boolean,
  boundingClientRect: Partial<DOMRectReadOnly> = {}
): IntersectionObserverEntry {
  const defaultRect = {
    top: 0,
    bottom: 100,
    left: 0,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  };

  return {
    target: element,
    isIntersecting,
    boundingClientRect: { ...defaultRect, ...boundingClientRect, toJSON: () => ({}) } as DOMRectReadOnly,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: { ...defaultRect, ...boundingClientRect, toJSON: () => ({}) } as DOMRectReadOnly,
    rootBounds: { ...defaultRect, toJSON: () => ({}) } as DOMRectReadOnly,
    time: Date.now(),
  };
}

/**
 * Helper: Trigger intersection with mock entries
 */
function triggerIntersection(entries: IntersectionObserverEntry[]) {
  act(() => {
    if (mockObserverCallback) {
      mockObserverCallback(entries, mockObserverInstance);
    }
  });
}

describe('ActiveBlockProvider', () => {
  it('throws error when useActiveBlock is called outside provider', () => {
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useActiveBlock must be used within ActiveBlockProvider');
  });

  it('initializes with no active block', () => {
    const { getByTestId } = render(
      <ActiveBlockProvider>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    expect(getByTestId('no-active-block')).toBeInTheDocument();
  });

  it('creates IntersectionObserver on mount', () => {
    render(
      <ActiveBlockProvider>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    expect(mockObserverInstance).toBeTruthy();
    expect(mockObserverInstance.observe).toHaveBeenCalled();
  });

  it('observes only top-level blocks when containerRef provided', () => {
    const containerRef = React.createRef<HTMLDivElement>();
    
    render(
      <div ref={containerRef}>
        <ActiveBlockProvider containerRef={containerRef}>
          <div data-block-id="block-1" data-block-type="heading">Block 1</div>
          <div data-block-id="block-2" data-block-type="paragraph">Block 2</div>
          <div data-block-id="block-3" data-block-type="code" data-block-version="C1">Block 3</div>
          <TestConsumer />
        </ActiveBlockProvider>
      </div>
    );

    // Production path: observes only direct children of containerRef
    expect(mockObserverInstance.observe).toHaveBeenCalledTimes(3);
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = render(
      <ActiveBlockProvider>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    unmount();

    expect(mockObserverInstance.disconnect).toHaveBeenCalled();
  });
});

describe('Active Block Selection - Single Block', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
  });

  it('sets active block when single block becomes visible', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;

    triggerIntersection([
      createMockEntry(block1, true, { top: 100, bottom: 200 }),
    ]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('block-1');
      expect(getByTestId('active-block-type')).toHaveTextContent('heading');
    });
  });

  it('clears active block when block leaves viewport', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;

    // Block enters
    triggerIntersection([createMockEntry(block1, true, { top: 100, bottom: 200 })]);
    await waitFor(() => expect(getByTestId('active-block-id')).toHaveTextContent('block-1'));

    // Block leaves
    triggerIntersection([createMockEntry(block1, false, { top: -200, bottom: -100 })]);
    await waitFor(() => expect(getByTestId('no-active-block')).toBeInTheDocument());
  });
});

describe('Active Block Selection - Multiple Blocks', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
  });

  it('selects block with highest intersection in anchor zone (top 25%)', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider anchorPosition={0.25}>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <div data-block-id="block-2" data-block-type="paragraph">Block 2</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;
    const block2 = container.querySelector('[data-block-id="block-2"]')!;

    // Block 1 is at top (fully in anchor zone)
    // Block 2 is below anchor zone
    // Anchor zone: 0-250px (25% of 1000px)
    triggerIntersection([
      createMockEntry(block1, true, { top: 50, bottom: 150 }),  // Fully in anchor
      createMockEntry(block2, true, { top: 300, bottom: 400 }), // Below anchor
    ]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('block-1');
    });
  });

  it('selects first block in DOM order when scores are equal', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider anchorPosition={0.25}>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <div data-block-id="block-2" data-block-type="paragraph">Block 2</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;
    const block2 = container.querySelector('[data-block-id="block-2"]')!;

    // Both blocks at same position (equal intersection)
    triggerIntersection([
      createMockEntry(block1, true, { top: 100, bottom: 200 }),
      createMockEntry(block2, true, { top: 100, bottom: 200 }),
    ]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('block-1');
    });
  });

  it('selects by DOM order NOT blockTop when intersection heights are equal', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider anchorPosition={0.25}>
        <div data-block-id="block-A" data-block-type="heading">Block A</div>
        <div data-block-id="block-B" data-block-type="paragraph">Block B</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const blockA = container.querySelector('[data-block-id="block-A"]')!;
    const blockB = container.querySelector('[data-block-id="block-B"]')!;

    // CRITICAL: Both blocks have EQUAL intersection height (50px)
    // But block-B has SMALLER blockTop (50 vs 100)
    // If implementation incorrectly uses blockTop as tie-break, it would select block-B
    // Correct behavior: select block-A (earlier in DOM order)
    triggerIntersection([
      createMockEntry(blockA, true, { top: 100, bottom: 150 }), // intersectionHeight = 50, blockTop = 100
      createMockEntry(blockB, true, { top: 50, bottom: 100 }),  // intersectionHeight = 50, blockTop = 50
    ]);

    await waitFor(() => {
      // Must be block-A (DOM order) NOT block-B (smaller blockTop)
      expect(getByTestId('active-block-id')).toHaveTextContent('block-A');
    });
  });

  it('updates active block when scrolling down', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider anchorPosition={0.25}>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <div data-block-id="block-2" data-block-type="paragraph">Block 2</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;
    const block2 = container.querySelector('[data-block-id="block-2"]')!;

    // Initial: block-1 in anchor zone
    triggerIntersection([
      createMockEntry(block1, true, { top: 100, bottom: 200 }),
      createMockEntry(block2, true, { top: 300, bottom: 400 }),
    ]);
    await waitFor(() => expect(getByTestId('active-block-id')).toHaveTextContent('block-1'));

    // Scroll down: block-2 now in anchor zone
    triggerIntersection([
      createMockEntry(block1, false, { top: -100, bottom: 0 }),
      createMockEntry(block2, true, { top: 100, bottom: 200 }),
    ]);
    await waitFor(() => expect(getByTestId('active-block-id')).toHaveTextContent('block-2'));
  });

  it('updates active block when scrolling up', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider anchorPosition={0.25}>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <div data-block-id="block-2" data-block-type="paragraph">Block 2</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;
    const block2 = container.querySelector('[data-block-id="block-2"]')!;

    // Initial: block-2 in anchor zone
    triggerIntersection([
      createMockEntry(block1, true, { top: -100, bottom: 0 }),
      createMockEntry(block2, true, { top: 100, bottom: 200 }),
    ]);
    await waitFor(() => expect(getByTestId('active-block-id')).toHaveTextContent('block-2'));

    // Scroll up: block-1 now in anchor zone
    triggerIntersection([
      createMockEntry(block1, true, { top: 100, bottom: 200 }),
      createMockEntry(block2, true, { top: 300, bottom: 400 }),
    ]);
    await waitFor(() => expect(getByTestId('active-block-id')).toHaveTextContent('block-1'));
  });

  it('selects topmost visible block when no blocks intersect anchor zone', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider anchorPosition={0.25}>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <div data-block-id="block-2" data-block-type="paragraph">Block 2</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;
    const block2 = container.querySelector('[data-block-id="block-2"]')!;

    // Both blocks below anchor zone (anchor: 0-250px)
    // block-1 is topmost
    triggerIntersection([
      createMockEntry(block1, true, { top: 300, bottom: 400 }),
      createMockEntry(block2, true, { top: 450, bottom: 550 }),
    ]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('block-1');
    });
  });
});

describe('Active Block Selection - Versioned Blocks', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
  });

  it('preserves blockVersion for D1 block', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider>
        <div data-block-id="def-1" data-block-type="definition" data-block-version="D1">D1 Block</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block = container.querySelector('[data-block-id="def-1"]')!;

    triggerIntersection([createMockEntry(block, true, { top: 100, bottom: 200 })]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('def-1');
      expect(getByTestId('active-block-type')).toHaveTextContent('definition');
      expect(getByTestId('active-block-version')).toHaveTextContent('D1');
    });
  });

  it('preserves blockVersion for C1 block', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider>
        <div data-block-id="code-1" data-block-type="code" data-block-version="C1">C1 Block</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block = container.querySelector('[data-block-id="code-1"]')!;

    triggerIntersection([createMockEntry(block, true, { top: 100, bottom: 200 })]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('code-1');
      expect(getByTestId('active-block-type')).toHaveTextContent('code');
      expect(getByTestId('active-block-version')).toHaveTextContent('C1');
    });
  });

  it('handles unversioned blocks (no data-block-version)', async () => {
    const { container, getByTestId, queryByTestId } = render(
      <ActiveBlockProvider>
        <div data-block-id="summary-1" data-block-type="summary">Summary Block</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block = container.querySelector('[data-block-id="summary-1"]')!;

    triggerIntersection([createMockEntry(block, true, { top: 100, bottom: 200 })]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('summary-1');
      expect(getByTestId('active-block-type')).toHaveTextContent('summary');
      expect(queryByTestId('active-block-version')).not.toBeInTheDocument();
    });
  });
});

describe('Active Block Selection - Edge Cases', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
  });

  it('handles no blocks visible', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;

    // No blocks intersecting
    triggerIntersection([createMockEntry(block1, false, { top: -200, bottom: -100 })]);

    await waitFor(() => {
      expect(getByTestId('no-active-block')).toBeInTheDocument();
    });
  });

  it('handles rapid intersection changes', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <div data-block-id="block-2" data-block-type="paragraph">Block 2</div>
        <div data-block-id="block-3" data-block-type="code" data-block-version="C1">Block 3</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;
    const block2 = container.querySelector('[data-block-id="block-2"]')!;
    const block3 = container.querySelector('[data-block-id="block-3"]')!;

    // Rapid scroll through blocks - each intersection replaces the previous state
    // First block enters
    triggerIntersection([
      createMockEntry(block1, true, { top: 100, bottom: 200 }),
      createMockEntry(block2, false, { top: 300, bottom: 400 }),
      createMockEntry(block3, false, { top: 500, bottom: 600 }),
    ]);
    
    // Second block enters, first leaves
    triggerIntersection([
      createMockEntry(block1, false, { top: -100, bottom: 0 }),
      createMockEntry(block2, true, { top: 100, bottom: 200 }),
      createMockEntry(block3, false, { top: 300, bottom: 400 }),
    ]);
    
    // Third block enters, second leaves
    triggerIntersection([
      createMockEntry(block1, false, { top: -300, bottom: -200 }),
      createMockEntry(block2, false, { top: -100, bottom: 0 }),
      createMockEntry(block3, true, { top: 100, bottom: 200 }),
    ]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('block-3');
    });
  });

  it('handles block removal from DOM', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider>
        <div data-block-id="block-1" data-block-type="heading">Block 1</div>
        <div data-block-id="block-2" data-block-type="paragraph">Block 2</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const block1 = container.querySelector('[data-block-id="block-1"]')!;
    const block2 = container.querySelector('[data-block-id="block-2"]')!;

    // Block 1 active
    triggerIntersection([
      createMockEntry(block1, true, { top: 100, bottom: 200 }),
      createMockEntry(block2, true, { top: 300, bottom: 400 }),
    ]);
    await waitFor(() => expect(getByTestId('active-block-id')).toHaveTextContent('block-1'));

    // Block 1 leaves viewport (simulate removal)
    triggerIntersection([
      createMockEntry(block1, false, { top: -200, bottom: -100 }),
      createMockEntry(block2, true, { top: 100, bottom: 200 }),
    ]);

    // Block 2 should become active
    await waitFor(() => expect(getByTestId('active-block-id')).toHaveTextContent('block-2'));
  });

  it('ignores elements without proper data-block-id', () => {
    render(
      <ActiveBlockProvider>
        <div>No identity</div>
        <div data-block-type="heading">Missing block-id</div>
        <div data-block-id="block-1">Missing block-type - will be observed but identity extraction will fail</div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    // Should observe element with data-block-id (even if block-type missing)
    // The observer queries all [data-block-id] elements
    // Identity extraction will return null for incomplete blocks
    expect(mockObserverInstance.observe).toHaveBeenCalledTimes(1);
  });
});

describe('Active Block Selection - Container Blocks', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
  });

  it('observes only top-level container block, not nested children', async () => {
    const containerRef = React.createRef<HTMLDivElement>();
    
    const { container } = render(
      <div ref={containerRef}>
        <ActiveBlockProvider containerRef={containerRef}>
          <div data-block-id="container-1" data-block-type="two-column">
            <div data-block-id="child-1" data-block-type="heading">Child 1</div>
            <div data-block-id="child-2" data-block-type="paragraph">Child 2</div>
          </div>
          <TestConsumer />
        </ActiveBlockProvider>
      </div>
    );

    // Production contract: only the top-level container is observed
    // Nested children are NOT independently observed
    expect(mockObserverInstance.observe).toHaveBeenCalledTimes(1);
  });

  it('selects container when it intersects anchor zone', async () => {
    const { container, getByTestId } = render(
      <ActiveBlockProvider anchorPosition={0.25}>
        <div data-block-id="container-1" data-block-type="two-column">
          <div data-block-id="child-1" data-block-type="heading">Child 1</div>
        </div>
        <TestConsumer />
      </ActiveBlockProvider>
    );

    const containerBlock = container.querySelector('[data-block-id="container-1"]')!;
    const childBlock = container.querySelector('[data-block-id="child-1"]')!;

    // Container in anchor zone, child below
    triggerIntersection([
      createMockEntry(containerBlock, true, { top: 100, bottom: 300 }),
      createMockEntry(childBlock, true, { top: 350, bottom: 450 }),
    ]);

    await waitFor(() => {
      expect(getByTestId('active-block-id')).toHaveTextContent('container-1');
      expect(getByTestId('active-block-type')).toHaveTextContent('two-column');
    });
  });
});

