import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => ({ warn: h.warn, error: h.error })),
}));

vi.mock('next/server', () => {
  class NextResponse extends Response {
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      super(body, init);
    }
    static json(body: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(body), init);
    }
  }
  return { NextResponse };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    child: h.child,
  },
}));

import { __test__, withLogging } from '@/lib/withLogging';

const makeRequest = (path: string, headers?: Record<string, string>) =>
  ({
    headers: new Headers(headers ?? {}),
    method: 'GET',
    nextUrl: new URL(`https://example.com${path}`),
  } as unknown as Request);

describe('withLogging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs client errors and sets request id', async () => {
    const handler = vi.fn(() => new Response('bad', { status: 404 }));
    const wrapped = withLogging(handler);

    const res = await wrapped(makeRequest('/api/test', { 'x-request-id': 'req-1' }) as any, {} as any);

    expect(h.warn).toHaveBeenCalled();
    expect(res.headers.get('x-request-id')).toBe('req-1');
  });

  it('logs server errors from handler responses', async () => {
    const handler = vi.fn(() => new Response('err', { status: 500 }));
    const wrapped = withLogging(handler);

    const res = await wrapped(makeRequest('/api/test') as any, {} as any);

    expect(h.error).toHaveBeenCalled();
    expect(res.status).toBe(500);
  });

  it('passes through success responses without logging errors', async () => {
    const handler = vi.fn(() => new Response('ok', { status: 200 }));
    const wrapped = withLogging(handler);

    const res = await wrapped(makeRequest('/api/test') as any, {} as any);

    expect(res.status).toBe(200);
    expect(h.warn).not.toHaveBeenCalled();
    expect(h.error).not.toHaveBeenCalled();
  });

  it('defaults status to 200 when handler response has undefined status', async () => {
    const handler = vi.fn(() => ({
      status: undefined,
      statusText: 'OK',
      headers: new Headers(),
      body: 'ok',
    }) as unknown as Response);
    const wrapped = withLogging(handler);

    const res = await wrapped(makeRequest('/api/test') as any, {} as any);

    expect(res.status).toBe(200);
  });

  it('logs thrown errors with stack in non-production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const handler = vi.fn(() => {
      throw new Error('boom admin@example.com');
    });
    const wrapped = withLogging(handler);

    const res = await wrapped(makeRequest('/api/test') as any, {} as any);

    expect(res.status).toBe(500);
    const payload = h.error.mock.calls[0][0];
    expect(payload.error).toContain('[REDACTED_EMAIL]');
    expect(payload.stack).toBeDefined();
    process.env.NODE_ENV = originalEnv;
  });

  it('omits stack traces in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const handler = vi.fn(() => {
      throw new Error('boom admin@example.com');
    });
    const wrapped = withLogging(handler);

    const res = await wrapped(makeRequest('/api/test') as any, {} as any);

    expect(res.status).toBe(500);
    const payload = h.error.mock.calls.at(-1)?.[0];
    expect(payload.stack).toBeUndefined();
    process.env.NODE_ENV = originalEnv;
  });

  it('logs unknown error when non-error is thrown', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const handler = vi.fn(() => {
      throw 'boom';
    });
    const wrapped = withLogging(handler);

    const res = await wrapped(makeRequest('/api/test') as any, {} as any);

    expect(res.status).toBe(500);
    const payload = h.error.mock.calls.at(-1)?.[0];
    expect(payload.error).toBe('Unknown error');
    expect(payload.stack).toBeUndefined();
    process.env.NODE_ENV = originalEnv;
  });
  it('scrubs strings, arrays, and objects for PII', () => {
    const scrubbedStr = __test__.scrub('contact admin@example.com');
    expect(scrubbedStr).toContain('[REDACTED_EMAIL]');

    const scrubbedArr = __test__.scrub(['ok', 'user@test.com']);
    expect(scrubbedArr).toEqual(['ok', '[REDACTED_EMAIL]']);

    const scrubbedObj = __test__.scrub({ token: 'abc', email: 'a@b.com', nested: ['x@y.com'] }) as any;
    expect(scrubbedObj.token).toBe('[REDACTED]');
    expect(scrubbedObj.email).toBe('[REDACTED]');
    expect(scrubbedObj.nested).toEqual(['[REDACTED_EMAIL]']);
  });

  it('returns primitives unchanged', () => {
    expect(__test__.scrub(42)).toBe(42);
    expect(__test__.scrub(false)).toBe(false);
  });
});
