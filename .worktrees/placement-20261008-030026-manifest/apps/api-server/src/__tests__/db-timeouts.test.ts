import { describe, it, expect, vi } from 'vitest';

// Simulating the withTimeout utility and DB engine behavior
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) =>
    setTimeout(() => resolve(fallback), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

describe('Infrastructure: Database Timeouts', () => {
  it('should return fallback if query exceeds timeout', async () => {
    const slowQuery = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
    
    // We expect this to fail if timeout is shorter than 100ms
    const result = await withTimeout(slowQuery, 20, 'timeout_reached');
    
    expect(result).toBe('timeout_reached');
  });

  it('should return data if query is faster than timeout', async () => {
    const fastQuery = Promise.resolve('data');
    
    const result = await withTimeout(fastQuery, 1000, 'timeout_reached');
    
    expect(result).toBe('data');
  });

  it('should propagate errors from the query', async () => {
    const errorQuery = Promise.reject(new Error('DB Error'));
    
    await expect(withTimeout(errorQuery, 1000, 'fallback')).rejects.toThrow('DB Error');
  });
});
