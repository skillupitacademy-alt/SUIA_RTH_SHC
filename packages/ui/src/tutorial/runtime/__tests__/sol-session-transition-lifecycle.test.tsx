import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlockTelemetryProvider } from '../BlockTelemetryProvider';
import * as ActiveBlock from '../ActiveBlockContext';

vi.mock('../ActiveBlockContext', async () => ({
  ...await vi.importActual<typeof ActiveBlock>('../ActiveBlockContext'),
  useActiveBlock: vi.fn(),
}));

const clock = vi.fn();
const initialBlock = { blockId: 'block-a', blockType: 'code', blockVersion: 'C1' };
const originalVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState');
let visibility: 'visible' | 'hidden';

function provider(sessionId: string | null, enabled = true) {
  return (
    <BlockTelemetryProvider
      navigationNodeId="node"
      subtopicId="subtopic"
      sectionId="section"
      sessionId={sessionId}
      enabled={enabled}
      heartbeatIntervalMs={30000}
    >
      <div>Learning content</div>
    </BlockTelemetryProvider>
  );
}

function acknowledgedResponse(): Response {
  return { ok: true, json: async () => ({ processed: true }) } as Response;
}

function activeTimeRequests() {
  return vi.mocked(fetch).mock.calls
    .filter(([url]) => url === '/api/tutorial/ils/block-active-time')
    .map(([, init]) => ({
      body: JSON.parse(init!.body as string),
      session: new Headers(init!.headers).get('x-session-id'),
    }));
}

describe('Sol session transition lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clock.mockReturnValue(0);
    vi.spyOn(performance, 'now').mockImplementation(clock);
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(acknowledgedResponse()));
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: initialBlock });
  });

  afterEach(async () => {
    await act(async () => { cleanup(); });
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalVisibility) {
      Object.defineProperty(document, 'visibilityState', originalVisibility);
    } else {
      Reflect.deleteProperty(document, 'visibilityState');
    }
  });

  it('retains captured labels on a visible same-block session change', async () => {
    const view = render(provider('session-a'));
    await act(async () => {});
    clock.mockReturnValue(5000);
    await act(async () => { view.rerender(provider('session-b')); });
    clock.mockReturnValue(9000);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });

    expect(activeTimeRequests().map(({ session, body }) => [session, body.activeTimeSec]))
      .toEqual([['session-a', 5], ['session-b', 4]]);
  });

  it('keeps a new session paused while the document remains hidden', async () => {
    const view = render(provider('session-a'));
    await act(async () => {});
    clock.mockReturnValue(5000);
    await act(async () => {
      visibility = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    clock.mockReturnValue(15000);
    await act(async () => { view.rerender(provider('session-b')); });
    clock.mockReturnValue(45000);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });

    const creditedSeconds = activeTimeRequests().reduce(
      (total, { body }) => total + body.activeTimeSec,
      0,
    );
    expect(creditedSeconds).toBe(5);
  });

  it('resumes only visible time after a hidden null-session cutover', async () => {
    const view = render(provider('session-a'));
    await act(async () => {});
    clock.mockReturnValue(5000);
    await act(async () => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
    clock.mockReturnValue(10000);
    await act(async () => { view.rerender(provider(null)); });
    clock.mockReturnValue(20000);
    await act(async () => { view.rerender(provider('session-b')); });
    clock.mockReturnValue(40000);
    await act(async () => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    clock.mockReturnValue(47000);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(activeTimeRequests().map(({ session, body }) => [session, body.activeTimeSec])).toEqual([['session-a', 5], ['session-b', 7]]);
  });

  it('starts enabled timing paused while hidden and resumes only after visibility', async () => {
    const view = render(provider('session-a', false));
    await act(async () => {});
    clock.mockReturnValue(10000);
    await act(async () => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
    await act(async () => { view.rerender(provider('session-a', true)); });
    clock.mockReturnValue(40000);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(activeTimeRequests()).toHaveLength(0);
    await act(async () => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    clock.mockReturnValue(44000);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(activeTimeRequests().map(item => item.body.activeTimeSec)).toEqual([4]);
  });

  it('preserves one interval under StrictMode effect replay', async () => {
    const view = render(<React.StrictMode>{provider('session-a')}</React.StrictMode>);
    await act(async () => {});
    clock.mockReturnValue(5000);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(activeTimeRequests().reduce((sum, item) => sum + item.body.activeTimeSec, 0)).toBe(5);
    view.unmount();
  });

  it('emits the initial block visit once under StrictMode effect replay', async () => {
    render(<React.StrictMode>{provider('session-a')}</React.StrictMode>);
    await act(async () => {});

    const visits = vi.mocked(fetch).mock.calls.filter(([url]) => (
      url === '/api/tutorial/ils/block-visit'
    ));
    expect(visits).toHaveLength(1);
    expect(JSON.parse(visits[0][1]!.body as string)).toMatchObject({
      blockId: initialBlock.blockId,
      sessionId: 'session-a',
    });
  });

  it('does not emit a deferred new-block visit after provider teardown', async () => {
    let release!: (response: Response) => void;
    const deferred = new Promise<Response>(resolve => { release = resolve; });
    vi.mocked(fetch).mockImplementation(async url => (
      url === '/api/tutorial/ils/block-active-time' ? deferred : acknowledgedResponse()
    ));
    const view = render(provider('session-a'));
    await act(async () => {});
    clock.mockReturnValue(5000);
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({
      activeBlock: { blockId: 'block-b', blockType: 'code', blockVersion: 'C1' },
    });
    await act(async () => { view.rerender(provider('session-b')); });
    expect(activeTimeRequests()).toHaveLength(1);
    await act(async () => { view.unmount(); });
    await act(async () => {
      release(acknowledgedResponse());
      await deferred;
    });

    const newBlockVisits = vi.mocked(fetch).mock.calls.filter(([url, init]) => (
      url === '/api/tutorial/ils/block-visit' &&
      JSON.parse(init!.body as string).blockId === 'block-b'
    ));
    expect(newBlockVisits).toHaveLength(0);
  });
  it('keeps a replayed same-block visit behind the pending old interval', async () => {
    let release!: (response: Response) => void;
    const deferred = new Promise<Response>(resolve => { release = resolve; });
    vi.mocked(fetch).mockImplementation(async url => url === '/api/tutorial/ils/block-active-time' ? deferred : acknowledgedResponse());
    const view = render(provider('session-a'));
    await act(async () => {});
    clock.mockReturnValue(5000);
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: { blockId: 'block-b', blockType: 'code', blockVersion: 'C1' } });
    await act(async () => { view.rerender(provider('session-b')); });
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: { blockId: 'block-b', blockType: 'code', blockVersion: 'C1' } });
    await act(async () => { view.rerender(provider('session-b')); });
    expect(vi.mocked(fetch).mock.calls.filter(([url, init]) => url === '/api/tutorial/ils/block-visit' && JSON.parse(init!.body as string).blockId === 'block-b')).toHaveLength(0);
    await act(async () => { release(acknowledgedResponse()); await deferred; });
    expect(vi.mocked(fetch).mock.calls.filter(([url, init]) => url === '/api/tutorial/ils/block-visit' && JSON.parse(init!.body as string).blockId === 'block-b')).toHaveLength(1);
  });
});
