import { describe, expect, it } from 'vitest';
import { runWithTrace, getCorrelationId, getRequestContext } from '../trace.context';

describe('TraceContext (RequestContext)', () => {
  it('should return undefined when outside a context', () => {
    expect(getCorrelationId()).toBeUndefined();
    expect(getRequestContext()).toBeUndefined();
  });

  it('should store and retrieve correlationId using string argument', () => {
    const testId = 'test-id-123';
    runWithTrace(testId, () => {
      expect(getCorrelationId()).toBe(testId);
      expect(getRequestContext()?.correlationId).toBe(testId);
    });
  });

  it('should store and retrieve full context object', () => {
    const context = {
        correlationId: 'req-456',
        userId: 'user-789',
        path: '/api/v1/exams'
    };

    runWithTrace(context, () => {
      expect(getCorrelationId()).toBe('req-456');
      
      const reqCtx = getRequestContext();
      expect(reqCtx).toBeDefined();
      expect(reqCtx?.userId).toBe('user-789');
      expect(reqCtx?.path).toBe('/api/v1/exams');
    });
  });

  it('should isolate contexts across async boundaries', async () => {
    const results: string[] = [];

    const asyncTask = (id: string, delay: number) => {
      return runWithTrace(id, async () => {
        // Wait a bit to ensure concurrency
        await new Promise(resolve => setTimeout(resolve, delay));
        // Retrieve ID inside the callback after async wait
        const retrievedId = getCorrelationId();
        if (retrievedId) results.push(retrievedId);
      });
    };

    // Run two tasks concurrently
    await Promise.all([
      asyncTask('context-A', 50),
      asyncTask('context-B', 10)
    ]);

    expect(results).toContain('context-A');
    expect(results).toContain('context-B');
    expect(results.length).toBe(2);
  });
});
