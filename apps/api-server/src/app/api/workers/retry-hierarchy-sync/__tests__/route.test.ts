import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyQStashSignature: vi.fn(),
  retryFailed: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/qstash-verify', () => ({
  verifyQStashSignature: mocks.verifyQStashSignature,
}));

vi.mock('@/modules/hierarchy/hierarchy-sync.service', () => ({
  HierarchySyncService: {
    retryFailed: mocks.retryFailed,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      error: mocks.loggerError,
      info: vi.fn(),
      warn: vi.fn(),
    }),
    error: mocks.loggerError,
  },
}));

import { POST } from '../route';

describe('POST /api/workers/retry-hierarchy-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests without a valid QStash signature', async () => {
    mocks.verifyQStashSignature.mockResolvedValueOnce({ valid: false, body: '' });

    const req = new NextRequest('http://localhost/api/workers/retry-hierarchy-sync', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mocks.retryFailed).not.toHaveBeenCalled();
  });

  it('reports a partial failed reconciliation as retriable HTTP 503', async () => {
    mocks.verifyQStashSignature.mockResolvedValueOnce({ valid: true, body: '{}' });
    mocks.retryFailed.mockResolvedValueOnce({
      total: 3,
      succeeded: 2,
      failed: 1,
      complete: false,
    });

    const req = new NextRequest('http://localhost/api/workers/retry-hierarchy-sync', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(503);
    expect(mocks.retryFailed).toHaveBeenCalledTimes(1);

    const body = await res.json();
    expect(body).toMatchObject({
      success: false,
      total: 3,
      succeeded: 2,
      failed: 1,
    });
  });

  it('returns success only for a completed current-state comparison', async () => {
    mocks.verifyQStashSignature.mockResolvedValueOnce({ valid: true, body: '{}' });
    mocks.retryFailed.mockResolvedValueOnce({ mode: 'CURRENT_STATE_RECONCILIATION', checked: 4, driftFound: 0, complete: true, failed: 0 });
    const res = await POST(new NextRequest('http://localhost/api/workers/retry-hierarchy-sync', { method: 'POST' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(await res.json()).toMatchObject({ success: true, checked: 4, driftFound: 0 });
  });

  it('exposes an unfinished bounded page without claiming completion', async () => {
    mocks.verifyQStashSignature.mockResolvedValueOnce({ valid: true, body: '{"limit":1}' });
    mocks.retryFailed.mockResolvedValueOnce({ checked: 1, failed: 0, complete: false, nextCursor: { entityType: 'domain', entityId: '00000000-0000-4000-8000-000000000001' } });
    const res = await POST(new NextRequest('http://localhost/api/workers/retry-hierarchy-sync', { method: 'POST' }));
    expect(res.status).toBe(409);
    expect(mocks.retryFailed).toHaveBeenCalledWith({ limit: 1 });
    expect(await res.json()).toMatchObject({ success: false, complete: false });
  });

  it('rejects oversized or malformed signed scopes without querying databases', async () => {
    mocks.verifyQStashSignature.mockResolvedValueOnce({ valid: true, body: '{"limit":100000}' });
    const res = await POST(new NextRequest('http://localhost/api/workers/retry-hierarchy-sync', { method: 'POST' }));
    expect(res.status).toBe(400);
    expect(mocks.retryFailed).not.toHaveBeenCalled();
  });

  it('does not turn an unavailable database into successful empty recovery', async () => {
    mocks.verifyQStashSignature.mockResolvedValueOnce({ valid: true, body: '{}' });
    mocks.retryFailed.mockRejectedValueOnce(new Error('isolated provider unavailable'));
    const res = await POST(new NextRequest('http://localhost/api/workers/retry-hierarchy-sync', { method: 'POST' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false });
  });
});
