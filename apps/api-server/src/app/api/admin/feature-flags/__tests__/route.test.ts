import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '../route';
import { container } from '@/modules/core/container';

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn(),
  },
}));

describe('GET /api/admin/feature-flags', () => {
  const mockTokenService = {
    getAccessToken: vi.fn(),
    verifyAdminAccessToken: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (container.get as unknown as vi.Mock).mockReturnValue(mockTokenService);
  });

  it('returns 401 when no admin token is present', async () => {
    mockTokenService.getAccessToken.mockReturnValueOnce(undefined);

    const req = new NextRequest('http://localhost/api/admin/feature-flags');
    const res = await GET(req, {} as unknown as never);

    expect(res.status).toBe(401);
  });

  it('returns flags with session cache headers when authorized', async () => {
    mockTokenService.getAccessToken.mockReturnValueOnce('token');
    mockTokenService.verifyAdminAccessToken.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost/api/admin/feature-flags');
    const res = await GET(req, {} as unknown as never);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache, max-age=0, must-revalidate');

    const body = await res.json();
    expect(body.flags).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });
});
