import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import pino from 'pino';

/**
 * Since the logger module exports a singleton and uses process.env.NODE_ENV to construct itself,
 * we can create a local factory for deterministic testing of the Pino configuration,
 * or mock the transport. For full predictability, we reconstruct a fresh logger using the same config
 * as the production module but pushing to a stream we can assert on.
 */

describe('Logger Infrastructure (Task 69)', () => {
  let stream: any;
  let localLogger: pino.Logger;

  beforeEach(() => {
    // A writable sink to capture logs for inspection
    stream = {
      write: vi.fn(),
    };

    // Instantiate with exact parameters as lib/logger.ts (Production mode)
    localLogger = pino({
      level: 'info', // Force info for testing info vs redacting
      serializers: pino.stdSerializers,
      formatters: {
        level: (label) => ({ level: label }),
      },
      redact: {
        paths: [
          'password',
          'token',
          'authorization',
          'cookie',
          'accessToken',
          'refreshToken',
          '*.password',
          '*.token',
          '*.authorization',
          '*.cookie',
          '*.accessToken',
          '*.refreshToken',
        ],
        censor: '[REDACTED]',
      },
      // Do not use pino-pretty in testing to verify raw JSON
    }, stream);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats level as string instead of Pino default integer', () => {
    localLogger.info('Testing string level format');
    const logs = stream.write.mock.calls[0][0];
    const parsed = JSON.parse(logs);
    
    expect(parsed.level).toBe('info');
    expect(parsed.msg).toBe('Testing string level format');
  });

  it('redacts sensitive root-level paths', () => {
    localLogger.info({ password: 'my-super-secret-password', plain: 'text' }, 'User created');
    
    const logs = stream.write.mock.calls[0][0];
    const parsed = JSON.parse(logs);

    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.plain).toBe('text');
  });

  it('redacts sensitive nested paths', () => {
    localLogger.info(
      { 
        user: { email: 'test@example.com', password: 'secretpassword', token: 'jwt123' } 
      }, 
      'User logged in'
    );
    
    const logs = stream.write.mock.calls[0][0];
    const parsed = JSON.parse(logs);

    expect(parsed.user.email).toBe('[REDACTED]');
    expect(parsed.user.password).toBe('[REDACTED]');
    expect(parsed.user.token).toBe('[REDACTED]');
  });

  it('redacts robust Personal Identifiable Information (PII)', () => {
    localLogger.info(
      {
        fullName: 'Jane Doe',
        phone: '555-0199',
        address: '123 Fake St',
        ipAddress: '192.168.1.5',
        creditCard: '4111-2222-3333-4444',
        metadata: {
           ssn: '000-00-0000',
           firstName: 'Jane'
        }
      },
      'Processing high-risk payload'
    );

    const logs = stream.write.mock.calls[0][0];
    const parsed = JSON.parse(logs);

    expect(parsed.fullName).toBe('[REDACTED]');
    expect(parsed.phone).toBe('[REDACTED]');
    expect(parsed.address).toBe('[REDACTED]');
    expect(parsed.ipAddress).toBe('[REDACTED]');
    expect(parsed.creditCard).toBe('[REDACTED]');
    expect(parsed.metadata.ssn).toBe('[REDACTED]');
    expect(parsed.metadata.firstName).toBe('[REDACTED]');
  });

  it('serializes errors beautifully with stack traces', () => {
    const error = new Error('Database connection failed');
    localLogger.error({ err: error }, 'Failed operation');
    
    const logs = stream.write.mock.calls[0][0];
    const parsed = JSON.parse(logs);
    
    expect(parsed.err).toBeDefined();
    expect(parsed.err.type).toBe('Error');
    expect(parsed.err.message).toBe('Database connection failed');
    expect(parsed.err.stack).toBeDefined(); // Pino stdSerializers enforces this
  });
});
