import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '../route';
import { unauthorized } from '@/lib/api-error';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

vi.mock('@/modules/auth/admin-audience.util', () => ({
  requireAdminRouteAccess: vi.fn(),
}));

describe('GET /api/admin/feature-flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no admin token is present', async () => {
    (requireAdminRouteAccess as unknown as vi.Mock).mockRejectedValueOnce(unauthorized('Unauthorized'));

    const req = new NextRequest('http://localhost/api/admin/feature-flags');
    const res = await GET(req, {} as unknown as never);

    expect(res.status).toBe(401);
  });

  it('returns flags with session cache headers when authorized', async () => {
    (requireAdminRouteAccess as unknown as vi.Mock).mockResolvedValueOnce({
      userId: 'admin-1',
      roles: ['admin'],
    });

    const req = new NextRequest('http://localhost/api/admin/feature-flags');
    const res = await GET(req, {} as unknown as never);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache, max-age=0, must-revalidate');

    const body = await res.json();
    expect(body.flags).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });
});
