import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { withSpan } from '../tracer';

const { mockSpan, mockTracer } = vi.hoisted(() => {
    const span = {
        end: vi.fn(),
        setStatus: vi.fn(),
        recordException: vi.fn(),
        setAttribute: vi.fn(),
    };

    const tracer = {
        startActiveSpan: vi.fn((_: string, optionsOrCb: unknown, maybeCb?: (span: typeof span) => unknown) => {
            if (typeof optionsOrCb === 'function') {
                return (optionsOrCb as (span: typeof span) => unknown)(span);
            }
            if (typeof maybeCb === 'function') {
                return maybeCb(span);
            }
            throw new Error('callback missing');
        }),
    };

    return { mockSpan: span, mockTracer: tracer };
});

// Mock the global OpenTelemetry API
vi.mock('@opentelemetry/api', () => {
    return {
        SpanStatusCode: {
            OK: 1,
            ERROR: 2,
        },
        trace: {
            getTracer: vi.fn(() => mockTracer),
        },
    };
});

describe('OpenTelemetry Tracer Utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('successfully executes a wrapped operation and closes the span', async () => {
        const operation = vi.fn().mockResolvedValue('success-result');
        
        const result = await withSpan('test-span', operation);

        expect(result).toBe('success-result');
        expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('test-span', {}, expect.any(Function));
        expect(operation).toHaveBeenCalledWith(mockSpan);
        expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
        expect(mockSpan.recordException).not.toHaveBeenCalled();
        expect(mockSpan.end).toHaveBeenCalled();
    });

    it('passes options through to the active span', async () => {
        const operation = vi.fn().mockResolvedValue('success-result');
        const opts = { attributes: { key: 'value' } };

        await withSpan('test-span-with-opts', operation, opts);

        expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('test-span-with-opts', opts, expect.any(Function));
    });

    it('captures an Error object and marks the span as ERROR', async () => {
        const error = new Error('Database disconnected');
        const operation = vi.fn().mockRejectedValue(error);

        await expect(withSpan('failing-span', operation)).rejects.toThrow('Database disconnected');

        expect(mockSpan.recordException).toHaveBeenCalledWith(error);
        expect(mockSpan.setStatus).toHaveBeenCalledWith({
            code: SpanStatusCode.ERROR,
            message: 'Database disconnected',
        });
        expect(mockSpan.end).toHaveBeenCalled(); // Ensure the span still ends
    });

    it('captures a thrown string literal and marks the span as ERROR', async () => {
        const operation = vi.fn().mockRejectedValue('String rejection');

        await expect(withSpan('failing-span-string', operation)).rejects.toEqual('String rejection');

        expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
        expect(mockSpan.setStatus).toHaveBeenCalledWith({
            code: SpanStatusCode.ERROR,
            message: 'String rejection',
        });
        expect(mockSpan.end).toHaveBeenCalled();
    });
});
