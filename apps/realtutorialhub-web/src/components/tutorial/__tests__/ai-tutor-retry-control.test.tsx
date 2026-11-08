import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useAiTutor } from '../useAiTutor';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it('permits retry after the server retry interval', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { 'retry-after': '1' } })));
  const { result } = renderHook(() => useAiTutor('Hello', '11111111-1111-4111-8111-111111111111', 'Topic'));
  act(() => result.current.setQuestion('Question'));
  await act(async () => { await result.current.submitQuestion(); });
  expect(result.current.isRateLimited).toBe(true);
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.isRateLimited).toBe(false);
});
it('cancels a pending retry when the subtopic changes', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { 'retry-after': '30' } })));
  const { result, rerender, unmount } = renderHook(({ id }) => useAiTutor('Hello', id, 'Topic'), { initialProps: { id: 'a' } });
  act(() => result.current.setQuestion('Question'));
  await act(async () => { await result.current.submitQuestion(); });
  expect(vi.getTimerCount()).toBe(1);
  rerender({ id: 'b' });
  expect(result.current.isRateLimited).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  unmount();
});
