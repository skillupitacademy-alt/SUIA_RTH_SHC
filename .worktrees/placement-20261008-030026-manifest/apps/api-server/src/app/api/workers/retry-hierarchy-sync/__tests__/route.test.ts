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

  it('retries failed hierarchy rows when the signature is valid', async () => {
    mocks.verifyQStashSignature.mockResolvedValueOnce({ valid: true, body: '{}' });
    mocks.retryFailed.mockResolvedValueOnce({
      total: 3,
      succeeded: 2,
      failed: 1,
    });

    const req = new NextRequest('http://localhost/api/workers/retry-hierarchy-sync', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mocks.retryFailed).toHaveBeenCalledTimes(1);

    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      total: 3,
      succeeded: 2,
      failed: 1,
    });
  });
});
