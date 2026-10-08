import { describe, it, expect } from 'vitest';
import {
  getCorrelationId,
  getPath,
  getRequestContext,
  getRequestId,
  getUserId,
  runWithTrace,
  setUserId,
  withRequestContext,
} from '../request-context';

describe('request-context', () => {
  it('uses explicit requestId and exposes accessors', () => {
    const result = withRequestContext(
      { requestId: 'req-1', userId: 'u1', ip: '127.0.0.1', path: '/x', startedAt: 123 },
      () => {
        setUserId('u2');
        return {
          ctx: getRequestContext(),
          requestId: getRequestId(),
          correlationId: getCorrelationId(),
          userId: getUserId(),
          path: getPath(),
        };
      }
    );

    expect(result.requestId).toBe('req-1');
    expect(result.correlationId).toBe('req-1');
    expect(result.userId).toBe('u2');
    expect(result.path).toBe('/x');
    expect(result.ctx?.startedAt).toBe(123);
  });

  it('falls back to correlationId when requestId is missing', () => {
    const result = withRequestContext({ correlationId: 'corr-1' }, () => ({
      requestId: getRequestId(),
      correlationId: getCorrelationId(),
    }));

    expect(result.requestId).toBe('corr-1');
    expect(result.correlationId).toBe('corr-1');
  });

  it('generates a requestId when none provided', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      configurable: true,
    });

    try {
      const result = withRequestContext({}, () => ({
        requestId: getRequestId(),
        correlationId: getCorrelationId(),
      }));

      expect(result.requestId).toBeDefined();
      expect(result.correlationId).toBe(result.requestId);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, 'crypto', originalDescriptor);
      } else {
        // Restore absence when crypto was not originally defined.
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (globalThis as any).crypto;
      }
    }
  });

  it('supports runWithTrace string shortcut', () => {
    const result = runWithTrace('trace-1', () => ({
      requestId: getRequestId(),
      correlationId: getCorrelationId(),
    }));

    expect(result.requestId).toBe('trace-1');
    expect(result.correlationId).toBe('trace-1');
  });
});
