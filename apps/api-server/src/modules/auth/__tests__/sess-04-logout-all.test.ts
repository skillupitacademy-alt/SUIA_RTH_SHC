import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/auth/logout-all/route';
import {
  GlobalLogoutService,
  PresenceStageError,
  RevocationStageError,
} from '@/modules/auth/global-logout.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

describe('SESS-04: Legacy Logout-All Compatibility Adapter (Offline Matrix)', () => {
  let mockTokenService: {
    getAccessToken: ReturnType<typeof vi.fn>;
    verifyAccessToken: ReturnType<typeof vi.fn>;
  };

  let mockGlobalLogoutService: {
    getActiveSessions: ReturnType<typeof vi.fn>;
    logoutAllDevices: ReturnType<typeof vi.fn>;
  };

  const VALID_USER_PAYLOAD = {
    userId: 'user-sess-1',
    email: 'learner@skillup.test',
    brand: 'skillup',
    tokenType: 'user' as const,
    isAdmin: false,
    aud: 'user',
    roles: ['student'],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockTokenService = {
      getAccessToken: vi.fn(),
      verifyAccessToken: vi.fn(),
    };

    mockGlobalLogoutService = {
      getActiveSessions: vi.fn(),
      logoutAllDevices: vi.fn(),
    };

    // Bind mocks to the DI container for the route
    vi.spyOn(container, 'get').mockImplementation((token: any) => {
      if (token === TokenService) return mockTokenService;
      if (token === GlobalLogoutService) return mockGlobalLogoutService;
      return {};
    });
  });

  function createRequest(options?: {
    authHeader?: string;
    host?: string;
    brandHeader?: string;
  }): NextRequest {
    const headers = new Headers();
    if (options?.authHeader) {
      headers.set('authorization', options.authHeader);
    }
    const host = options?.host ?? 'skillup.test';
    headers.set('host', host);
    headers.set('origin', 'https://' + host);
    headers.set('x-brand', options?.brandHeader ?? 'skillup');

    return new NextRequest('https://' + host + '/api/auth/logout-all', {
      method: 'POST',
      headers,
    });
  }

  it('Scenario 1: Confirmed Success returns legacy JSON shape with snapshot count and no Set-Cookie', async () => {
    mockTokenService.getAccessToken.mockReturnValue('valid-token');
    mockTokenService.verifyAccessToken.mockResolvedValue(VALID_USER_PAYLOAD);
    mockGlobalLogoutService.getActiveSessions.mockResolvedValue([
      { id: 's1', deviceId: 'd1' },
      { id: 's2', deviceId: 'd2' },
      { id: 's3', deviceId: 'd3' },
    ]);
    mockGlobalLogoutService.logoutAllDevices.mockResolvedValue({
      success: true,
      message: 'Logged out from all devices',
    });

    const req = createRequest({ authHeader: 'Bearer valid-token', host: 'skillup.test' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      message: 'Logged out from all devices successfully',
      revokedSessions: 3,
      timestamp: expect.any(String),
    });
    // Invariant: No new Set-Cookie header introduced
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(mockGlobalLogoutService.logoutAllDevices).toHaveBeenCalledWith(
      'user-sess-1',
      expect.any(String),
      'skillup'
    );
  });

  it('Scenario 2: Pre-operation count query failure is classified as pre-commit failure (revocation not attempted)', async () => {
    mockTokenService.getAccessToken.mockReturnValue('valid-token');
    mockTokenService.verifyAccessToken.mockResolvedValue(VALID_USER_PAYLOAD);
    mockGlobalLogoutService.getActiveSessions.mockRejectedValue(new Error('DB read timeout'));

    const req = createRequest({ authHeader: 'Bearer valid-token', host: 'skillup.test' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Unable to inspect sessions; revocation not attempted',
    });
    // Crucial: revocation was never attempted!
    expect(mockGlobalLogoutService.logoutAllDevices).not.toHaveBeenCalled();
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('Scenario 3: RevocationStageError produces 500 with Unknown Revocation Outcome and retry semantics', async () => {
    mockTokenService.getAccessToken.mockReturnValue('valid-token');
    mockTokenService.verifyAccessToken.mockResolvedValue(VALID_USER_PAYLOAD);
    mockGlobalLogoutService.getActiveSessions.mockResolvedValue([{ id: 's1' }]);
    mockGlobalLogoutService.logoutAllDevices.mockRejectedValue(new RevocationStageError());

    const req = createRequest({ authHeader: 'Bearer valid-token', host: 'skillup.test' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Session revocation outcome unknown; retry with valid credentials',
    });
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('Scenario 4: PresenceStageError produces 500 distinguishing confirmed revocation from presence failure', async () => {
    mockTokenService.getAccessToken.mockReturnValue('valid-token');
    mockTokenService.verifyAccessToken.mockResolvedValue(VALID_USER_PAYLOAD);
    mockGlobalLogoutService.getActiveSessions.mockResolvedValue([{ id: 's1' }]);
    mockGlobalLogoutService.logoutAllDevices.mockRejectedValue(new PresenceStageError());

    const req = createRequest({ authHeader: 'Bearer valid-token', host: 'skillup.test' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Sessions revoked; presence update could not be confirmed',
    });
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('Scenario 5: Denies missing token with 401', async () => {
    mockTokenService.getAccessToken.mockReturnValue(undefined);

    const req = createRequest();
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('Scenario 6: Denies invalid/expired token with 401', async () => {
    mockTokenService.getAccessToken.mockReturnValue('expired-token');
    mockTokenService.verifyAccessToken.mockRejectedValue(new Error('Token expired'));

    const req = createRequest({ authHeader: 'Bearer expired-token' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Invalid or expired token');
  });

  it('Scenario 7: Denies infra token class with 403', async () => {
    mockTokenService.getAccessToken.mockReturnValue('infra-token');
    mockTokenService.verifyAccessToken.mockResolvedValue({
      ...VALID_USER_PAYLOAD,
      tokenType: 'infra' as any,
    });

    const req = createRequest({ authHeader: 'Bearer infra-token' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden: Invalid credential class');
  });

  it('Scenario 8: Denies foreign/non-tenant brand (e.g. skillhubcore) with 403', async () => {
    mockTokenService.getAccessToken.mockReturnValue('shc-token');
    mockTokenService.verifyAccessToken.mockResolvedValue({
      ...VALID_USER_PAYLOAD,
      brand: 'skillhubcore' as any,
    });

    const req = createRequest({ authHeader: 'Bearer shc-token' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden: Invalid tenant brand');
  });

  it('Scenario 9: Denies request when brand mismatch detected', async () => {
    mockTokenService.getAccessToken.mockReturnValue('valid-token');
    // Token is for skillup, but request header says realtutorialhub
    mockTokenService.verifyAccessToken.mockResolvedValue(VALID_USER_PAYLOAD);

    const req = createRequest({
      authHeader: 'Bearer valid-token',
      host: 'realtutorialhub.test',
      brandHeader: 'realtutorialhub',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBeDefined();
  });
});
