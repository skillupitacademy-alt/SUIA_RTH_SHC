/* eslint-disable @next/next/no-assign-module-variable */
'use client';

import { useEffect, useState } from 'react';

/**
 * A hook that returns a debounced version of the provided value.
 * Useful for delaying search queries or expensive operations until the user stops typing.
 *
 * @param value The value to debounce
 * @param delayMs The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
