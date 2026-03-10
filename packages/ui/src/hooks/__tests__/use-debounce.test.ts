import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from '../use-debounce';

describe('Hooks: useDebounce (Task 90)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' }
    });

    // Update value
    rerender({ value: 'updated' });
    
    // Should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward 250ms (halfway)
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    // Fast-forward remaining 250ms
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timer on rapid updates', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: '1' }
    });

    rerender({ value: '2' });
    act(() => {
        vi.advanceTimersByTime(300);
    });

    rerender({ value: '3' }); // Should reset timer to 500ms from here
    
    act(() => {
        vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('1'); // Still '1' because only 300ms passed since '3'

    act(() => {
        vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('3');
  });
});
