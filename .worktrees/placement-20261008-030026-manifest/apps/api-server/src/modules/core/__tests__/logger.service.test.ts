import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import pino from 'pino';
import { LoggerService } from '../logger.service';

describe('LoggerService Wrapper (Task 70)', () => {
    let mockPino: any;
    let loggerService: LoggerService;

    beforeEach(() => {
        // Create mock Pino shape
        mockPino = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            trace: vi.fn(),
            fatal: vi.fn(),
            child: vi.fn().mockImplementation((bindings) => ({ ...mockPino, _bindings: bindings })),
        };

        loggerService = new LoggerService(mockPino as unknown as pino.Logger);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Standard Dispatching', () => {
        it('should proxy info calls', () => {
            loggerService.info({ user: 1 }, 'Test %s', 'msg');
            expect(mockPino.info).toHaveBeenCalledWith({ user: 1 }, 'Test %s', 'msg');
        });

        it('should proxy warn calls', () => {
            loggerService.warn('Warning string only');
            expect(mockPino.warn).toHaveBeenCalledWith('Warning string only', undefined);
        });

        it('should proxy trace calls', () => {
            loggerService.trace({ traceId: 't1' }, 'trace %s', 'ok');
            expect(mockPino.trace).toHaveBeenCalledWith({ traceId: 't1' }, 'trace %s', 'ok');
        });

        it('should proxy fatal calls', () => {
            loggerService.fatal({ reason: 'panic' }, 'fatal');
            expect(mockPino.fatal).toHaveBeenCalledWith({ reason: 'panic' }, 'fatal');
        });
    });

    describe('Enhanced Error Handling', () => {
        it('should proxy raw objects normally', () => {
            loggerService.error({ customErr: true }, 'Oops');
            expect(mockPino.error).toHaveBeenCalledWith({ customErr: true }, 'Oops');
        });

        it('should auto-wrap bare Javascript Errors without a msg string', () => {
            const rawErr = new Error('Database disconnected');
            loggerService.error(rawErr);
            
            expect(mockPino.error).toHaveBeenCalledWith(
                { err: rawErr },
                'Database disconnected'
            );
        });

        it('should auto-wrap bare Javascript Errors with a custom msg string', () => {
            const rawErr = new Error('Database disconnected');
            loggerService.error(rawErr, 'Failed processing user');
            
            expect(mockPino.error).toHaveBeenCalledWith(
                { err: rawErr },
                'Failed processing user'
            );
        });
    });

    describe('Child Loggers', () => {
        it('should correctly build a child LoggerService', () => {
            const childLogger = loggerService.child({ requestId: 'req-123' });
            
            // Should be an instance of LoggerService, not just a raw Pino child
            expect(childLogger).toBeInstanceOf(LoggerService);
            
            // Calling a method on the child should route to the child Pino mock
            childLogger.info('Testing child');
            expect(mockPino.child).toHaveBeenCalledWith({ requestId: 'req-123' });
        });
    });
});
