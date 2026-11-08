// @vitest-environment jsdom
import React, { useRef } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { TutorialBlockRenderer } from '../TutorialBlockRenderer';
import { ActiveBlockProvider } from '../runtime/ActiveBlockContext';
import { createD1Fixture } from '../../../../db-tutorial/src/services/__tests__/test-fixtures';

const childContext = vi.hoisted(() => vi.fn());
vi.mock('../blocks/DefinitionBlock', async (importOriginal) => {
  const original = await importOriginal<typeof import('../blocks/DefinitionBlock')>();
  return { ...original, DefinitionBlock: (props: React.ComponentProps<typeof original.DefinitionBlock>) => {
    childContext(props.runtimeContext);
    return <original.DefinitionBlock {...props} />;
  } };
});

it('nested child has its own DOM identity while the observer retains top-level selection', async () => {
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
    left: { blocks: [{ id: 'child-block', type: 'paragraph', content: { text: 'child marker' } }, createD1Fixture({ id: 'instructional-child-observed' })] },
    right: { blocks: [] },
  } };
  function MountedConsumer() {
    const container = useRef<HTMLDivElement>(null);
    return <ActiveBlockProvider containerRef={container}><div ref={container}>
      <TutorialBlockRenderer block={parent as never} theme={{ primary: '#123456', secondary: '#654321' } as never} runtimeContext={{ learnerId: 'learner', navigationNodeId: 'node', sectionId: 'section', subtopicId: 'subtopic', blockId: 'parent-block', blockType: 'two-column', blockVersion: 'unversioned' }} />
      <TutorialBlockRenderer block={{ id: 'sibling-observed', type: 'paragraph', content: { text: 'sibling marker' } } as never} />
    </div></ActiveBlockProvider>;
  }
  try {
    render(<MountedConsumer />);
    const child = screen.getByText('child marker');
    await waitFor(() => expect(created).toHaveBeenCalled());
    expect.soft(child.getAttribute('data-block-id')).toBe('child-block');
    expect(observed).not.toContain(child);
    expect(observed).toContain(child.closest('[data-block-id="parent-block"]'));
    const instructionalChild = document.querySelector('[data-block-id="instructional-child-observed"]');
    const sibling = document.querySelector('[data-block-id="sibling-observed"]');
    expect(instructionalChild).not.toBeNull();
    expect(observed).not.toContain(instructionalChild);
    expect(observed).toContain(sibling);
  } finally {
    cleanup();
    vi.unstubAllGlobals();
  }
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  childContext.mockClear();
});

it.each([true, false])('preserves nested and sibling identities with runtime context: %s', (withContext) => {
  const document = { id: 'parent', type: 'two-column', content: {
    left: { blocks: [
      { id: 'child', type: 'paragraph', content: { text: 'child' } },
      { id: 'nested', type: 'two-column', content: {
        left: { blocks: [createD1Fixture({ id: 'instructional-child' })] },
        right: { blocks: [{ id: 'grandchild', type: 'paragraph', content: { text: 'grandchild' } }] },
      } },
    ] },
    right: { blocks: [{ id: 'sibling', type: 'paragraph', content: { text: 'sibling' } }] },
  } };
  const runtimeContext = { learnerId: 'learner', navigationNodeId: 'node', sectionId: 'section', subtopicId: 'subtopic', blockId: 'parent', blockType: 'two-column', blockVersion: 'unversioned' };
  const { container } = render(<TutorialBlockRenderer block={document as never} theme={{ primary: '#123456', secondary: '#654321' } as never} runtimeContext={withContext ? runtimeContext : undefined} />);
  for (const id of ['parent', 'child', 'nested', 'instructional-child', 'grandchild', 'sibling']) {
    expect(container.querySelectorAll(`[data-block-id="${id}"]`)).toHaveLength(1);
  }
  expect(container.querySelector('[data-block-id="instructional-child"]')?.getAttribute('data-block-version')).toBe('D1');
  if (withContext) {
    expect(childContext).toHaveBeenCalledWith({ ...runtimeContext, blockId: 'instructional-child', blockType: 'definition', blockVersion: 'D1' });
  } else {
    expect(childContext).toHaveBeenCalledWith(undefined);
  }
});
