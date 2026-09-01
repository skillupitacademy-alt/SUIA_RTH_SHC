/**
 * Active Block Integration Tests
 * Phase 3C-A: Prove production-style integration
 * 
 * SCOPE:
 * - TutorialBlockRenderer → ActiveBlockProvider integration
 * - Canonical top-level block observation
 * - Container blocks vs nested children
 * - Versioned block identity (D1, C1, S1)
 * 
 * DOES NOT TEST:
 * - Block renderer internals
 * - ILS APIs
 * - LearnerProgressPanel
 * - Persistence
 */

import React, { useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActiveBlockProvider, useActiveBlock } from '../runtime/ActiveBlockContext';
import type { TutorialBlock } from '../types';

// Mock IntersectionObserver
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;
  private elements: Set<Element> = new Set();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  // Test helper: trigger intersection
  triggerIntersection(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this);
  }

  // Test helper: get observed elements
  getObservedElements(): Element[] {
    return Array.from(this.elements);
  }
}

let mockObserver: MockIntersectionObserver;

describe('ActiveBlock Integration', () => {
  beforeEach(() => {
    global.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        mockObserver = new MockIntersectionObserver(callback);
        return mockObserver as unknown as IntersectionObserver;
      }
    } as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test harness simulating production TutorialPageShell structure
   */
  function ProductionTestHarness({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
      <ActiveBlockProvider containerRef={containerRef}>
        <div ref={containerRef} className="tutorial-content">
          {children}
        </div>
      </ActiveBlockProvider>
    );
  }

  /**
   * ActiveBlock display component for testing
   */
  function ActiveBlockDisplay() {
    const { activeBlock } = useActiveBlock();
    return (
      <div data-testid="active-block-display">
        {activeBlock ? (
          <>
            <span data-testid="active-block-id">{activeBlock.blockId}</span>
            <span data-testid="active-block-type">{activeBlock.blockType}</span>
            <span data-testid="active-block-version">{activeBlock.blockVersion || 'unversioned'}</span>
          </>
        ) : (
          <span data-testid="no-active-block">null</span>
        )}
      </div>
    );
  }

  /**
   * Simulate canonical block renderer output
   * Phase 2 contract: data-block-id, data-block-type, data-block-version
   */
  function SimulatedBlock({ block }: { block: TutorialBlock }) {
    const version = 'version' in block && typeof block.version === 'string' 
      ? block.version 
      : undefined;

    return (
      <div
        data-block-id={block.id}
        data-block-type={block.type}
        data-block-version={version}
        className="tutorial-block"
      >
        <h2>{block.type} Block</h2>
        <p>ID: {block.id}</p>
        {version && <p>Version: {version}</p>}
      </div>
    );
  }

  /**
   * Simulate container block with nested children
   */
  function SimulatedContainerBlock({ block }: { block: TutorialBlock & { type: 'two-column' } }) {
    const version = 'version' in block && typeof block.version === 'string' 
      ? block.version 
      : undefined;

    return (
      <div
        data-block-id={block.id}
        data-block-type={block.type}
        data-block-version={version}
        className="tutorial-block two-column"
      >
        <div className="column-left">
          <div data-block-id="nested-child-1" data-block-type="text">
            Nested Child 1
          </div>
        </div>
        <div className="column-right">
          <div data-block-id="nested-child-2" data-block-type="text">
            Nested Child 2
          </div>
        </div>
      </div>
    );
  }

  describe('Top-Level Block Observation', () => {
    it('observes only top-level blocks in canonical content container', () => {
      const blocks: TutorialBlock[] = [
        { id: 'd1-id', type: 'definition', version: 'D1' } as TutorialBlock,
        { id: 'c1-id', type: 'code', version: 'C1' } as TutorialBlock,
        { id: 's1-id', type: 'summary', version: 'S1' } as TutorialBlock,
      ];

      render(
        <ProductionTestHarness>
          {blocks.map(block => (
            <SimulatedBlock key={block.id} block={block} />
          ))}
        </ProductionTestHarness>
      );

      const observed = mockObserver.getObservedElements();
      expect(observed).toHaveLength(3);
      
      // Verify each top-level block is observed
      expect(observed[0].getAttribute('data-block-id')).toBe('d1-id');
      expect(observed[1].getAttribute('data-block-id')).toBe('c1-id');
      expect(observed[2].getAttribute('data-block-id')).toBe('s1-id');
    });

    it('observes container block but NOT nested children', () => {
      const containerBlock = {
        id: 'two-col-id',
        type: 'two-column',
        version: 'TC1'
      } as TutorialBlock & { type: 'two-column' };

      render(
        <ProductionTestHarness>
          <SimulatedContainerBlock block={containerBlock} />
        </ProductionTestHarness>
      );

      const observed = mockObserver.getObservedElements();
      
      // Only 1 observation: the container parent
      expect(observed).toHaveLength(1);
      expect(observed[0].getAttribute('data-block-id')).toBe('two-col-id');
      expect(observed[0].getAttribute('data-block-type')).toBe('two-column');
      
      // Nested children NOT observed
      const allBlocks = document.querySelectorAll('[data-block-id]');
      expect(allBlocks).toHaveLength(3); // parent + 2 children exist in DOM
      
      // But only parent is observed
      const observedIds = observed.map(el => el.getAttribute('data-block-id'));
      expect(observedIds).not.toContain('nested-child-1');
      expect(observedIds).not.toContain('nested-child-2');
    });
  });

  describe('Versioned Block Identity', () => {
    it('preserves D1 version identity', async () => {
      const d1Block: TutorialBlock = {
        id: 'd1-test',
        type: 'definition',
        version: 'D1'
      } as TutorialBlock;

      const { getByTestId } = render(
        <ProductionTestHarness>
          <SimulatedBlock block={d1Block} />
          <ActiveBlockDisplay />
        </ProductionTestHarness>
      );

      const blockElement = document.querySelector('[data-block-id="d1-test"]')!;
      
      mockObserver.triggerIntersection([
        {
          target: blockElement,
          isIntersecting: true,
          boundingClientRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 1,
          intersectionRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);

      await waitFor(() => {
        expect(getByTestId('active-block-id').textContent).toBe('d1-test');
        expect(getByTestId('active-block-type').textContent).toBe('definition');
        expect(getByTestId('active-block-version').textContent).toBe('D1');
      });
    });

    it('preserves C1 version identity', async () => {
      const c1Block: TutorialBlock = {
        id: 'c1-test',
        type: 'code',
        version: 'C1'
      } as TutorialBlock;

      const { getByTestId } = render(
        <ProductionTestHarness>
          <SimulatedBlock block={c1Block} />
          <ActiveBlockDisplay />
        </ProductionTestHarness>
      );

      const blockElement = document.querySelector('[data-block-id="c1-test"]')!;
      
      mockObserver.triggerIntersection([
        {
          target: blockElement,
          isIntersecting: true,
          boundingClientRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 1,
          intersectionRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);

      await waitFor(() => {
        expect(getByTestId('active-block-id').textContent).toBe('c1-test');
        expect(getByTestId('active-block-type').textContent).toBe('code');
        expect(getByTestId('active-block-version').textContent).toBe('C1');
      });
    });

    it('preserves S1 version identity', async () => {
      const s1Block: TutorialBlock = {
        id: 's1-test',
        type: 'summary',
        version: 'S1'
      } as TutorialBlock;

      const { getByTestId } = render(
        <ProductionTestHarness>
          <SimulatedBlock block={s1Block} />
          <ActiveBlockDisplay />
        </ProductionTestHarness>
      );

      const blockElement = document.querySelector('[data-block-id="s1-test"]')!;
      
      mockObserver.triggerIntersection([
        {
          target: blockElement,
          isIntersecting: true,
          boundingClientRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 1,
          intersectionRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);

      await waitFor(() => {
        expect(getByTestId('active-block-id').textContent).toBe('s1-test');
        expect(getByTestId('active-block-type').textContent).toBe('summary');
        expect(getByTestId('active-block-version').textContent).toBe('S1');
      });
    });

    it('handles unversioned blocks', async () => {
      const unversionedBlock: TutorialBlock = {
        id: 'unversioned-test',
        type: 'text',
      } as TutorialBlock;

      const { getByTestId } = render(
        <ProductionTestHarness>
          <SimulatedBlock block={unversionedBlock} />
          <ActiveBlockDisplay />
        </ProductionTestHarness>
      );

      const blockElement = document.querySelector('[data-block-id="unversioned-test"]')!;
      
      mockObserver.triggerIntersection([
        {
          target: blockElement,
          isIntersecting: true,
          boundingClientRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 1,
          intersectionRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);

      await waitFor(() => {
        expect(getByTestId('active-block-id').textContent).toBe('unversioned-test');
        expect(getByTestId('active-block-type').textContent).toBe('text');
        expect(getByTestId('active-block-version').textContent).toBe('unversioned');
      });
    });
  });

  describe('Active Block Transitions', () => {
    it('transitions from D1 to C1 to S1 as blocks scroll into view', async () => {
      const blocks: TutorialBlock[] = [
        { id: 'd1-transition', type: 'definition', version: 'D1' } as TutorialBlock,
        { id: 'c1-transition', type: 'code', version: 'C1' } as TutorialBlock,
        { id: 's1-transition', type: 'summary', version: 'S1' } as TutorialBlock,
      ];

      const { getByTestId } = render(
        <ProductionTestHarness>
          {blocks.map(block => (
            <SimulatedBlock key={block.id} block={block} />
          ))}
          <ActiveBlockDisplay />
        </ProductionTestHarness>
      );

      const d1Element = document.querySelector('[data-block-id="d1-transition"]')!;
      const c1Element = document.querySelector('[data-block-id="c1-transition"]')!;
      const s1Element = document.querySelector('[data-block-id="s1-transition"]')!;

      // Initially D1 is active
      mockObserver.triggerIntersection([
        {
          target: d1Element,
          isIntersecting: true,
          boundingClientRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 1,
          intersectionRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);

      await waitFor(() => {
        expect(getByTestId('active-block-type').textContent).toBe('definition');
        expect(getByTestId('active-block-version').textContent).toBe('D1');
      });

      // Scroll to C1
      mockObserver.triggerIntersection([
        {
          target: d1Element,
          isIntersecting: false,
          boundingClientRect: { top: -400, bottom: 0, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 0,
          intersectionRect: { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
        {
          target: c1Element,
          isIntersecting: true,
          boundingClientRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 1,
          intersectionRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);

      await waitFor(() => {
        expect(getByTestId('active-block-type').textContent).toBe('code');
        expect(getByTestId('active-block-version').textContent).toBe('C1');
      });

      // Scroll to S1
      mockObserver.triggerIntersection([
        {
          target: c1Element,
          isIntersecting: false,
          boundingClientRect: { top: -400, bottom: 0, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 0,
          intersectionRect: { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
        {
          target: s1Element,
          isIntersecting: true,
          boundingClientRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 1,
          intersectionRect: { top: 0, bottom: 400, left: 0, right: 800, width: 800, height: 400, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);

      await waitFor(() => {
        expect(getByTestId('active-block-type').textContent).toBe('summary');
        expect(getByTestId('active-block-version').textContent).toBe('S1');
      });
    });
  });

  describe('Container Block Active State', () => {
    it('marks container as active, not nested children', async () => {
      const containerBlock = {
        id: 'container-active-test',
        type: 'two-column',
        version: 'TC1'
      } as TutorialBlock & { type: 'two-column' };

      const { getByTestId } = render(
        <ProductionTestHarness>
          <SimulatedContainerBlock block={containerBlock} />
          <ActiveBlockDisplay />
        </ProductionTestHarness>
      );

      const containerElement = document.querySelector('[data-block-id="container-active-test"]')!;
      
      mockObserver.triggerIntersection([
        {
          target: containerElement,
          isIntersecting: true,
          boundingClientRect: { top: 0, bottom: 600, left: 0, right: 800, width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}) },
          intersectionRatio: 1,
          intersectionRect: { top: 0, bottom: 600, left: 0, right: 800, width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}) },
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);

      await waitFor(() => {
        // Container is active
        expect(getByTestId('active-block-id').textContent).toBe('container-active-test');
        expect(getByTestId('active-block-type').textContent).toBe('two-column');
        expect(getByTestId('active-block-version').textContent).toBe('TC1');
        
        // NOT nested child IDs
        expect(getByTestId('active-block-id').textContent).not.toBe('nested-child-1');
        expect(getByTestId('active-block-id').textContent).not.toBe('nested-child-2');
      });
    });
  });
});
