import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlockTelemetryProvider } from '../BlockTelemetryProvider';
import * as ActiveBlock from '../ActiveBlockContext';
import { TelemetryCallbackContext } from '../TelemetryCallbackContext';
vi.mock('../ActiveBlockContext', async () => ({ ...await vi.importActual<typeof ActiveBlock>('../ActiveBlockContext'), useActiveBlock: vi.fn() }));
const now = vi.fn();
const ids = { navigationNodeId: 'node', subtopicId: 'subtopic', sectionId: 'section', sessionId: 'session', heartbeatIntervalMs: 30000 };
const block = (id: string, version: string) => ({ blockId: id, blockType: 'code', blockVersion: version });
const requests = () => vi.mocked(fetch).mock.calls.filter(c => c[0] === '/api/tutorial/ils/block-active-time').map(c => JSON.parse((c[1] as RequestInit).body as string));
const view = () => <BlockTelemetryProvider {...ids}><div>content</div></BlockTelemetryProvider>;
describe('provider pending delivery', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(performance, 'now').mockImplementation(now); now.mockReturnValue(0); vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('retains A across transition and retries identical event to acknowledgement', async () => {
    let fail = true;
    vi.mocked(fetch).mockImplementation(async url => url === '/api/tutorial/ils/block-active-time' && fail ? ({ ok: false } as Response) : ({ ok: true, json: async () => ({ processed: true }) } as Response));
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C1') });
    const { rerender } = render(view()); await act(async () => {});
    now.mockReturnValue(15000); vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('B', 'D1') });
    await act(async () => { rerender(view()); });
    expect(requests()).toHaveLength(1); expect(requests()[0]).toMatchObject({ blockId: 'A', blockVersion: 'C1', activeTimeSec: 15 });
    fail = false; now.mockReturnValue(45000); await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const a = requests().filter(x => x.blockId === 'A'); expect(a).toHaveLength(2); expect(a[1]).toEqual(a[0]);
    expect(requests().filter(x => x.blockId === 'B')).toMatchObject([{ blockVersion: 'D1', activeTimeSec: 30 }]);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); }); expect(requests().filter(x => x.eventId === a[0].eventId)).toHaveLength(2);
  });
  it('preserves distinct A and B through failed A to B to C transitions', async () => {
    let fail = true;
    vi.mocked(fetch).mockImplementation(async url => url === '/api/tutorial/ils/block-active-time' && fail ? ({ ok: false } as Response) : ({ ok: true, json: async () => ({ processed: true }) } as Response));
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C1') }); const { rerender } = render(view()); await act(async () => {});
    now.mockReturnValue(30000); vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('B', 'D1') }); await act(async () => { rerender(view()); });
    now.mockReturnValue(50000); vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('C', 'S1') }); await act(async () => { rerender(view()); });
    const initial = requests(); const a = initial.find(x => x.blockId === 'A'); const b = initial.find(x => x.blockId === 'B');
    expect(a).toMatchObject({ blockVersion: 'C1', activeTimeSec: 30 }); expect(b).toMatchObject({ blockVersion: 'D1', activeTimeSec: 20 });
    fail = false; await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const final = requests(); expect(final.filter(x => x.eventId === a.eventId).length).toBeGreaterThanOrEqual(2); expect(final.filter(x => x.eventId === b.eventId).length).toBeGreaterThanOrEqual(2);
    const count = final.length; await act(async () => { await vi.advanceTimersByTimeAsync(30000); }); expect(requests()).toHaveLength(count);
  });
  it.each(['processed', 'duplicate', 'false', 'malformed', 'missing'] as const)('handles %s acknowledgement without silent loss', async kind => {
    let first = true;
    vi.mocked(fetch).mockImplementation(async url => {
      if (url !== '/api/tutorial/ils/block-active-time') return { ok: true, json: async () => ({}) } as Response;
      if (!first) return { ok: true, json: async () => ({ processed: true }) } as Response;
      first = false;
      if (kind === 'malformed') return { ok: true, json: async () => { throw new Error('bad JSON'); } } as unknown as Response;
      return { ok: true, json: async () => kind === 'processed' ? { processed: true } : kind === 'duplicate' ? { alreadyProcessed: true } : kind === 'false' ? { processed: false } : {} } as Response;
    });
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C1') }); render(view()); await act(async () => {});
    now.mockReturnValue(15000); await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const initial = requests(); expect(initial).toHaveLength(1); expect(initial[0]).toMatchObject({ blockId: 'A', blockVersion: 'C1', activeTimeSec: 15 });
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const all = requests();
    if (kind === 'processed' || kind === 'duplicate') expect(all).toHaveLength(1);
    else { expect(all).toHaveLength(2); expect(all[1]).toEqual(all[0]); }
  });
  it('does not emit visit or active time when disabled', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ processed: true }) } as Response);
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C1') });
    render(<BlockTelemetryProvider {...ids} enabled={false}><div>content</div></BlockTelemetryProvider>);
    now.mockReturnValue(90000); await act(async () => { await vi.advanceTimersByTimeAsync(90000); });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('does not double-send a pending increment during unmount', async () => {
    let release!: (response: Response) => void; const deferred = new Promise<Response>(resolve => { release = resolve; });
    vi.mocked(fetch).mockImplementation(async url => url === '/api/tutorial/ils/block-active-time' ? deferred : ({ ok: true, json: async () => ({ processed: true }) } as Response));
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C1') }); const { unmount } = render(view()); await act(async () => {});
    now.mockReturnValue(10000); await act(async () => { vi.advanceTimersByTime(30000); });
    expect(requests()).toHaveLength(1); expect(requests()[0]).toMatchObject({ blockId: 'A', blockVersion: 'C1', activeTimeSec: 10 });
    unmount(); expect(requests()).toHaveLength(1);
    await act(async () => { release({ ok: true, json: async () => ({ processed: true }) } as Response); await deferred; });
    expect(requests()).toHaveLength(1);
  });
  it('preserves old page and version on a pending event across page/session transition', async () => {
    let fail = true;
    vi.mocked(fetch).mockImplementation(async url => url === '/api/tutorial/ils/block-active-time' && fail ? ({ ok: false } as Response) : ({ ok: true, json: async () => ({ processed: true }) } as Response));
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C1') });
    const { rerender } = render(view()); await act(async () => {}); now.mockReturnValue(15000);
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C2') });
    await act(async () => { rerender(<BlockTelemetryProvider {...ids} navigationNodeId="new-node" sectionId="new-section" sessionId="new-session"><div>new</div></BlockTelemetryProvider>); });
    const first = requests()[0]; expect(first).toMatchObject({ navigationNodeId: 'node', sectionId: 'section', blockId: 'A', blockVersion: 'C1', activeTimeSec: 15 });
    fail = false; now.mockReturnValue(45000); await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const all = requests(); const old = all.filter(x => x.eventId === first.eventId); expect(old.length).toBeGreaterThanOrEqual(2); expect(old.every(x => x.navigationNodeId === 'node' && x.blockVersion === 'C1')).toBe(true);
    expect(all.some(x => x.navigationNodeId === 'new-node' && x.sectionId === 'new-section' && x.blockVersion === 'C2')).toBe(true);
    const oldHeaders = vi.mocked(fetch).mock.calls.filter(c => c[0] === '/api/tutorial/ils/block-active-time' && JSON.parse((c[1] as RequestInit).body as string).eventId === first.eventId).map(c => new Headers((c[1] as RequestInit).headers).get('x-session-id'));
    expect(oldHeaders.length).toBeGreaterThanOrEqual(2);
    expect(oldHeaders[0]).toBe('session');
    expect(oldHeaders.slice(1).every(header => header === 'session')).toBe(true);
  });
  it.each(['processed', 'duplicate', 'malformed'] as const)('isolates callback failure for %s acknowledgement', async kind => {
    const callback = vi.fn(() => { throw new Error('notification failure'); });
    let first = true;
    vi.mocked(fetch).mockImplementation(async url => {
      if (url !== '/api/tutorial/ils/block-active-time') return { ok: true, json: async () => ({}) } as Response;
      if (first && kind === 'malformed') { first = false; return { ok: true, json: async () => { throw new Error('bad JSON'); } } as unknown as Response; }
      first = false;
      return { ok: true, json: async () => ({ ...(kind === 'duplicate' ? { alreadyProcessed: true } : { processed: true }), data: { blockId: 'A', blockVersion: 'C1', activeTimeSec: 15 } }) } as Response;
    });
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C1') });
    render(<TelemetryCallbackContext.Provider value={{ onActiveTimeDeliveryAcknowledged: callback }}>{view()}</TelemetryCallbackContext.Provider>); await act(async () => {});
    now.mockReturnValue(15000); await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const initial = requests()[0]; expect(initial).toMatchObject({ blockId: 'A', blockVersion: 'C1', activeTimeSec: 15 });
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(requests().filter(x => x.eventId === initial.eventId)).toHaveLength(kind === 'malformed' ? 2 : 1);
    expect(callback).toHaveBeenCalledExactlyOnceWith('A', 'C1', expect.objectContaining({ activeTimeSec: 15 }));
  });
  it('retries a failed capped chunk without losing the complete 1200 seconds', async () => {
    let first = true; vi.mocked(fetch).mockImplementation(async url => { if (url === '/api/tutorial/ils/block-active-time' && first) { first = false; return { ok: false } as Response; } return { ok: true, json: async () => ({ processed: true }) } as Response; });
    vi.mocked(ActiveBlock.useActiveBlock).mockReturnValue({ activeBlock: block('A', 'C1') }); render(view()); await act(async () => {});
    now.mockReturnValue(1200000); await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    const initial = requests(); expect(initial.map(x => x.activeTimeSec)).toEqual([600, 600]);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); }); const all = requests();
    expect(all.map(x => x.activeTimeSec)).toEqual([600, 600, 600]); expect(all[2].eventId).toBe(initial[0].eventId); expect(new Set(all.map(x => x.eventId)).size).toBe(2);
  });
});
