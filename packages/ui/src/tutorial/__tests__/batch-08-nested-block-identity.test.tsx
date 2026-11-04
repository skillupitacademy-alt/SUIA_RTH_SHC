// @vitest-environment jsdom
import React, { useRef } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { TutorialBlockRenderer } from '../TutorialBlockRenderer';
import { ActiveBlockProvider } from '../runtime/ActiveBlockContext';

it('nested child exposes and sends its own identity to the actual active-block observer', async () => {
  const observed: Element[] = [];
  const created = vi.fn();
  class Observer {
    constructor() { created(); }
    observe(element: Element) { observed.push(element); }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', Observer);
  const parent = { id: 'parent-block', type: 'two-column', content: {
    left: { blocks: [{ id: 'child-block', type: 'paragraph', content: { text: 'child marker' } }] },
    right: { blocks: [] },
  } };
  function MountedConsumer() {
    const container = useRef<HTMLDivElement>(null);
    return <ActiveBlockProvider containerRef={container}><div ref={container}>
      <TutorialBlockRenderer block={parent as never} runtimeContext={{ learnerId: 'learner', navigationNodeId: 'node', sectionId: 'section', subtopicId: 'subtopic', blockId: 'parent-block', blockType: 'two-column', blockVersion: 'unversioned' }} />
    </div></ActiveBlockProvider>;
  }
  try {
    render(<MountedConsumer />);
    const child = screen.getByText('child marker');
    await waitFor(() => expect(created).toHaveBeenCalled());
    expect.soft(child.getAttribute('data-block-id')).toBe('child-block');
    expect(observed).toContain(child);
  } finally {
    cleanup();
    vi.unstubAllGlobals();
  }
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
