import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  verifyAdminAccessToken: vi.fn(),
  verifyAdmin: vi.fn(),
  syncAll: vi.fn(),
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn(() => ({
      getAccessToken: mocks.getAccessToken,
      verifyAdminAccessToken: mocks.verifyAdminAccessToken,
    })),
  },
}));

vi.mock('@/modules/auth/rbac.service', () => ({
  _verifyAdmin: mocks.verifyAdmin,
}));

vi.mock('@/modules/hierarchy/hierarchy-sync.service', () => ({
  HierarchySyncService: {
    syncAll: mocks.syncAll,
  },
}));

import { POST } from '../route';

describe('POST /api/admin/hierarchy/sync', () => {
  const originalInternalKey = process.env.INTERNAL_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_KEY = originalInternalKey;
  });

  it('uses the internal key for the bulk backfill path', async () => {
    process.env.INTERNAL_API_KEY = 'internal-key';
    mocks.syncAll.mockResolvedValueOnce({
      total: 4,
      succeeded: 4,
      failed: 0,
    });

    const req = new NextRequest('http://localhost/api/admin/hierarchy/sync', {
      headers: {
        'x-internal-key': 'internal-key',
      },
    });

    const res = await POST(req, {} as never);

    expect(res.status).toBe(200);
    expect(mocks.getAccessToken).not.toHaveBeenCalled();
    expect(mocks.syncAll).toHaveBeenCalledTimes(1);

    const body = await res.json();
    expect(body).toMatchObject({
      total: 4,
      succeeded: 4,
      failed: 0,
      authSource: 'internal',
    });
  });

  it('falls back to admin auth when the internal key is absent', async () => {
    mocks.getAccessToken.mockReturnValueOnce('admin-token');
    mocks.verifyAdminAccessToken.mockResolvedValueOnce({ userId: 'admin-1' });
    mocks.verifyAdmin.mockResolvedValueOnce(true);
    mocks.syncAll.mockResolvedValueOnce({
      total: 0,
      succeeded: 0,
      failed: 0,
    });

    const req = new NextRequest('http://localhost/api/admin/hierarchy/sync');
    const res = await POST(req, {} as never);

    expect(res.status).toBe(200);
    expect(mocks.getAccessToken).toHaveBeenCalledTimes(1);
    expect(mocks.verifyAdminAccessToken).toHaveBeenCalledWith('admin-token', { audience: 'admin' });
    expect(mocks.verifyAdmin).toHaveBeenCalledWith({ userId: 'admin-1' });
    expect(mocks.syncAll).toHaveBeenCalledTimes(1);
  });

  it('rejects callers without internal key or admin token', async () => {
    mocks.getAccessToken.mockReturnValueOnce(undefined);

    const req = new NextRequest('http://localhost/api/admin/hierarchy/sync');
    const res = await POST(req, {} as never);

    expect(res.status).toBe(401);
    expect(mocks.syncAll).not.toHaveBeenCalled();
  });
});
