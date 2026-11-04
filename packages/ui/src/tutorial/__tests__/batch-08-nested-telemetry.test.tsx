import React, { useRef } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TutorialBlockRenderer } from '../TutorialBlockRenderer';
import { ActiveBlockProvider } from '../runtime/ActiveBlockContext';
import { BlockTelemetryProvider } from '../runtime/BlockTelemetryProvider';
import { createD1Fixture } from '../../../../db-tutorial/src/services/__tests__/test-fixtures';

it('delivers the selected top-level parent identity rather than nested child identity', async () => {
  let callback!: IntersectionObserverCallback;
  const observed: Element[] = [];
  class Observer { constructor(cb: IntersectionObserverCallback) { callback = cb; } observe(el: Element) { observed.push(el); } unobserve() {} disconnect() {} }
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ processed: true }) } as Response)));
  const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
  const parent = { id: 'parent', type: 'two-column', content: { left: { blocks: [createD1Fixture({ id: 'child' })] }, right: { blocks: [] } } };
  function Harness() {
    const container = useRef<HTMLDivElement>(null);
    return <ActiveBlockProvider containerRef={container}><BlockTelemetryProvider navigationNodeId="node" subtopicId="subtopic" sectionId="section" sessionId="session" heartbeatIntervalMs={20}>
      <div ref={container}><TutorialBlockRenderer block={parent as never} theme={{ primary: '#123456', secondary: '#654321' } as never} /><TutorialBlockRenderer block={createD1Fixture({ id: 'sibling' }) as never} theme={{ primary: '#123456', secondary: '#654321' } as never} /></div>
    </BlockTelemetryProvider></ActiveBlockProvider>;
  }
  try {
    render(<Harness />);
    await waitFor(() => expect(observed).toHaveLength(2));
    expect(observed[0]?.getAttribute('data-block-id')).toBe('parent');
    expect(observed[1]?.getAttribute('data-block-id')).toBe('sibling');
    expect(document.querySelector('[data-block-id="child"]')?.getAttribute('data-block-version')).toBe('D1');
    expect(observed).not.toContain(document.querySelector('[data-block-id="child"]'));
    await act(async () => { callback([{ target: observed[0], isIntersecting: true, boundingClientRect: { top: 0, bottom: 100 } } as IntersectionObserverEntry], {} as IntersectionObserver); });
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(call => call[0] === '/api/tutorial/ils/block-visit')).toBe(true));
    await act(async () => {});
    clock.mockReturnValue(3000);
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(call => call[0] === '/api/tutorial/ils/block-active-time')).toBe(true));
    const bodies = vi.mocked(fetch).mock.calls.filter(call => String(call[0]).includes('/block-')).map(call => JSON.parse((call[1] as RequestInit).body as string));
    expect(bodies.every(body => body.blockId === 'parent')).toBe(true);
    expect(bodies.some(body => body.blockVersion === 'unversioned' && body.activeTimeSec === 3)).toBe(true);
    expect(bodies.every(body => body.navigationNodeId === 'node' && body.subtopicId === 'subtopic' && body.sectionId === 'section')).toBe(true);
    await act(async () => { callback([{ target: observed[0], isIntersecting: false, boundingClientRect: { top: 0, bottom: 100 } }, { target: observed[1], isIntersecting: true, boundingClientRect: { top: 0, bottom: 100 } }] as IntersectionObserverEntry[], {} as IntersectionObserver); });
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(call => String((call[1] as RequestInit)?.body).includes('sibling'))).toBe(true));
    const siblingBodies = vi.mocked(fetch).mock.calls.filter(call => String(call[0]).includes('/block-')).map(call => JSON.parse((call[1] as RequestInit).body as string)).filter(body => body.blockId === 'sibling');
    expect(siblingBodies.some(body => body.blockVersion === 'D1')).toBe(true);
  } finally { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
it('attributes exclusive intervals to same-type versioned siblings', async () => {
  let callback!: IntersectionObserverCallback;
  const observed: Element[] = [];
  class Observer { constructor(cb: IntersectionObserverCallback) { callback = cb; } observe(el: Element) { observed.push(el); } unobserve() {} disconnect() {} }
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ processed: true }) } as Response)));
  const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
  function Harness() {
    const container = useRef<HTMLDivElement>(null);
    return <ActiveBlockProvider containerRef={container}><BlockTelemetryProvider navigationNodeId="node" subtopicId="subtopic" sectionId="section" sessionId="session" heartbeatIntervalMs={20}>
      <div ref={container}>{['A', 'B'].map(id => <TutorialBlockRenderer key={id} block={createD1Fixture({ id }) as never} theme={{ primary: '#123456', secondary: '#654321' } as never} />)}</div>
    </BlockTelemetryProvider></ActiveBlockProvider>;
  }
  const switchTo = async (index: number) => {
    await act(async () => { callback(observed.map((target, i) => ({ target, isIntersecting: i === index, boundingClientRect: { top: 0, bottom: 100 } })) as IntersectionObserverEntry[], {} as IntersectionObserver); });
  };
  try {
    render(<Harness />); await waitFor(() => expect(observed).toHaveLength(2));
    await switchTo(0); await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(call => String((call[1] as RequestInit)?.body).includes('"blockId":"A"'))).toBe(true));
    await act(async () => {}); clock.mockReturnValue(3000); await switchTo(1);
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(call => String((call[1] as RequestInit)?.body).includes('"blockId":"B"'))).toBe(true));
    await act(async () => {}); clock.mockReturnValue(8000);
    await waitFor(() => {
      const bodies = vi.mocked(fetch).mock.calls.filter(call => call[0] === '/api/tutorial/ils/block-active-time').map(call => JSON.parse((call[1] as RequestInit).body as string));
      expect(bodies).toEqual(expect.arrayContaining([expect.objectContaining({ blockId: 'A', blockVersion: 'D1', activeTimeSec: 3 }), expect.objectContaining({ blockId: 'B', blockVersion: 'D1', activeTimeSec: 5 })]));
      expect(bodies.reduce((sum, body) => sum + body.activeTimeSec, 0)).toBe(8);
    });
  } finally { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
