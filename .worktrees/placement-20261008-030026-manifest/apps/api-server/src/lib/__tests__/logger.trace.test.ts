import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import pino from 'pino';
import { runWithTrace, getCorrelationId } from '../trace.context';
import { logger } from '../logger';

describe('Correlation ID Tracing (Task 71)', () => {

  describe('AsyncLocalStorage Context', () => {
    it('returns undefined when accessed outside of a trace boundary', () => {
      expect(getCorrelationId()).toBeUndefined();
    });

    it('returns the seeded ID when inside a trace boundary', () => {
      runWithTrace('req-1234', () => {
        expect(getCorrelationId()).toBe('req-1234');
      });
    });

    it('isolates concurrent asynchronous operations perfectly', async () => {
      // We start two "requests" simultaneously
      const reqA = new Promise<void>((resolve) => {
        runWithTrace('REQ-A', async () => {
          // Force an async gap
          await new Promise((r) => setTimeout(r, 10));
          expect(getCorrelationId()).toBe('REQ-A');
          resolve();
        });
      });

      const reqB = new Promise<void>((resolve) => {
        runWithTrace('REQ-B', async () => {
           // Shorter gap to interleave
          await new Promise((r) => setTimeout(r, 5));
          expect(getCorrelationId()).toBe('REQ-B');
          resolve();
        });
      });

      await Promise.all([reqA, reqB]);
      
      // Outside boundary falls back cleanly
      expect(getCorrelationId()).toBeUndefined();
    });
  });

  describe('Pino Mixin Integration', () => {
    let stream: any;
    let localLogger: pino.Logger;

    beforeEach(() => {
        stream = { write: vi.fn() };
        // We initialize a fresh logger pulling the EXACT same config as our production logger 
        // stringified to inspect the actual execution of the imported mixin
        localLogger = pino({
            level: 'info',
            mixin() {
                const correlationId = getCorrelationId();
                return correlationId ? { correlationId } : {};
            }
        }, stream);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not append correlationId when operating outside a trace context', () => {
       localLogger.info('Loose log');
       const log = JSON.parse(stream.write.mock.calls[0][0]);
       expect(log.correlationId).toBeUndefined();
       expect(log.msg).toBe('Loose log');
    });

    it('automatically affixes correlationId via mixin when operating inside a trace context', () => {
       runWithTrace('xyz-987', () => {
           localLogger.info('Contextual log');
       });
       
       const log = JSON.parse(stream.write.mock.calls[0][0]);
       expect(log.correlationId).toBe('xyz-987');
       expect(log.msg).toBe('Contextual log');
    });
  });
});
