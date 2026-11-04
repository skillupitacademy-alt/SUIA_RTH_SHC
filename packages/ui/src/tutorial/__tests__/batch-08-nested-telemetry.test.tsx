import React, { useRef } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TutorialBlockRenderer } from '../TutorialBlockRenderer';
import { ActiveBlockProvider } from '../runtime/ActiveBlockContext';
import { BlockTelemetryProvider } from '../runtime/BlockTelemetryProvider';

it('delivers the selected top-level parent identity rather than nested child identity', async () => {
  let callback!: IntersectionObserverCallback;
  const observed: Element[] = [];
  class Observer { constructor(cb: IntersectionObserverCallback) { callback = cb; } observe(el: Element) { observed.push(el); } unobserve() {} disconnect() {} }
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ processed: true }) } as Response)));
  const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
  const parent = { id: 'parent', type: 'two-column', content: { left: { blocks: [{ id: 'child', type: 'paragraph', content: { text: 'child' } }] }, right: { blocks: [] } } };
  function Harness() {
    const container = useRef<HTMLDivElement>(null);
    return <ActiveBlockProvider containerRef={container}><BlockTelemetryProvider navigationNodeId="node" subtopicId="subtopic" sectionId="section" sessionId="session" heartbeatIntervalMs={20}>
      <div ref={container}><TutorialBlockRenderer block={parent as never} /></div>
    </BlockTelemetryProvider></ActiveBlockProvider>;
  }
  try {
    render(<Harness />);
    await waitFor(() => expect(observed).toHaveLength(1));
    expect(observed[0]?.getAttribute('data-block-id')).toBe('parent');
    await act(async () => { callback([{ target: observed[0], isIntersecting: true, boundingClientRect: { top: 0, bottom: 100 } } as IntersectionObserverEntry], {} as IntersectionObserver); });
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(call => call[0] === '/api/tutorial/ils/block-visit')).toBe(true));
    await act(async () => {});
    clock.mockReturnValue(3000);
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(call => call[0] === '/api/tutorial/ils/block-active-time')).toBe(true));
    const bodies = vi.mocked(fetch).mock.calls.filter(call => String(call[0]).includes('/block-')).map(call => JSON.parse((call[1] as RequestInit).body as string));
    expect(bodies.every(body => body.blockId === 'parent')).toBe(true);
    expect(bodies.some(body => body.blockVersion === 'unversioned' && body.activeTimeSec === 3)).toBe(true);
    expect(bodies.every(body => body.navigationNodeId === 'node' && body.subtopicId === 'subtopic' && body.sectionId === 'section')).toBe(true);
  } finally { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
