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

function provider(sessionId: string) {
  return (
    <BlockTelemetryProvider
      navigationNodeId="node"
      subtopicId="subtopic"
      sectionId="section"
      sessionId={sessionId}
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
});
