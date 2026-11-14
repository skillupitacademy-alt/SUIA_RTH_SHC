import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateGatewaySecret } from '@/middleware/gateway-auth.middleware';
import { validateRequest } from '@/middleware/internal-auth.middleware';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { proxy } from '@/proxy';

/**
 * B08-G: Invalid Privileged/Internal Authentication Anti-Downshift Boundary
 *
 * Governing Architecture: audit/FinalAechitecture.md (Internal Service-to-Service Trust, Zero Downshift)
 * Governing Task: audit/W1.2_Gemini_Batch_08_Corrections_And_Containment_Task.md (Package G)
 *
 * Verifies that:
 * 1. Valid internal service control succeeds with disposable process-local configuration.
 * 2. Public endpoints (e.g. /api/health, /api/auth/login) allow passage without internal secret.
 * 3. Invalid internal secret fails closed (401 in validateRequest, 403 in validateGatewaySecret).
 * 4. Invalid gateway secret fails closed (401 in validateRequest, 403 in validateGatewaySecret).
 * 5. Anti-Downshift Invariant (Middleware): A request presenting an invalid privileged/internal credential
 *    cannot fall through / downshift into a less trusted identity, even if it simultaneously
 *    carries an otherwise valid learner session cookie or Bearer token.
 * 6. Direct API access without gateway or internal secret is rejected fail-closed (403 Forbidden).
 * 7. Real Signed Learner Credential through API Proxy:
 *    Demonstrates the live proxy behavior with actual cryptographic tokens.
 *    Requires the proxy to reject an explicit invalid key before learner fallback.
 */

describe('B08-G: Invalid Privileged/Internal Authentication Boundary & Anti-Downshift', () => {
  const TEST_INTERNAL_SECRET = 'disposable-internal-api-secret-12345';
  const TEST_GATEWAY_SECRET = 'disposable-gateway-trust-secret-67890';

  const originalEnv = { ...process.env };
  let previousTokenServiceInstance: TokenService | null = null;
  let previousContainerTokenService: any = null;
  let previousUserRepository: UserRepository;
  let previousTokenRepository: TokenRepository;

  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = TEST_INTERNAL_SECRET;
    process.env.INTERNAL_GATEWAY_SECRET = TEST_GATEWAY_SECRET;
    process.env.GATEWAY_TRUST_SECRET = TEST_GATEWAY_SECRET;
    process.env.INTERNAL_API_KEY = TEST_INTERNAL_SECRET;

    previousUserRepository = container.get(UserRepository);
    previousTokenRepository = container.get(TokenRepository);
    try {
      previousTokenServiceInstance = TokenService.getInstance();
    } catch {
      previousTokenServiceInstance = null;
    }
    try {
      previousContainerTokenService = container.get(TokenService);
    } catch {
      previousContainerTokenService = null;
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    container.register(UserRepository, previousUserRepository);
    container.register(TokenRepository, previousTokenRepository);
    if (previousTokenServiceInstance) {
      TokenService.setInstance(previousTokenServiceInstance);
    }
    if (previousContainerTokenService) {
      container.register(TokenService, previousContainerTokenService);
    }
  });

  it('1. POSITIVE CONTROL: Valid internal service request is accepted with authMode internal', () => {
    const req = new NextRequest('https://api.internal.test/api/analytics/summary', {
      headers: {
        'x-internal-secret': TEST_INTERNAL_SECRET,
        'x-user-id': 'service-user-1',
        'x-brand': 'skillup',
        'x-correlation-id': 'corr-101',
      },
    });

    const result = validateRequest(req);
    expect(result.error).toBeUndefined();
    expect(result.context).toBeDefined();
    expect(result.context?.authMode).toBe('internal');
    expect(result.context?.userId).toBe('service-user-1');
    expect(result.context?.brand).toBe('skillup');

    const gatewayError = validateGatewaySecret(req);
    expect(gatewayError).toBeNull();
  });

  it('2. PUBLIC ENDPOINT EXEMPTION: health and login paths allow passage without secret in gateway middleware', () => {
    const healthReq = new NextRequest('https://api.internal.test/api/health');
    expect(validateGatewaySecret(healthReq)).toBeNull();

    const loginReq = new NextRequest('https://api.internal.test/api/auth/login');
    expect(validateGatewaySecret(loginReq)).toBeNull();
  });

  it('3. INVALID INTERNAL SECRET: rejected fail-closed (401 / 403)', async () => {
    const req = new NextRequest('https://api.internal.test/api/protected/resource', {
      headers: {
        'x-internal-secret': 'WRONG_INTERNAL_SECRET_XYZ',
        'x-user-id': 'service-user-1',
        'x-brand': 'skillup',
      },
    });

    const res = validateRequest(req);
    expect(res.error).toBeDefined();
    expect(res.error?.status).toBe(401);
    const body = await res.error?.json();
    expect(body.message).toBe('Invalid internal service secret');

    const gatewayRes = validateGatewaySecret(req);
    expect(gatewayRes).not.toBeNull();
    expect(gatewayRes?.status).toBe(403);
    const gatewayBody = await gatewayRes?.json();
    expect(gatewayBody.message).toBe('Invalid internal service secret');
  });

  it('4. INVALID GATEWAY SECRET: rejected fail-closed (401 / 403)', async () => {
    const req = new NextRequest('https://api.internal.test/api/protected/resource', {
      headers: {
        'x-gateway-secret': 'WRONG_GATEWAY_SECRET_XYZ',
        'x-user-id': 'service-user-1',
        'x-brand': 'skillup',
      },
    });

    const res = validateRequest(req);
    expect(res.error).toBeDefined();
    expect(res.error?.status).toBe(401);
    const body = await res.error?.json();
    expect(body.message).toBe('Invalid gateway credentials');

    const gatewayRes = validateGatewaySecret(req);
    expect(gatewayRes).not.toBeNull();
    expect(gatewayRes?.status).toBe(403);
    const gatewayBody = await gatewayRes?.json();
    expect(gatewayBody.message).toBe('Invalid gateway secret');
  });

  it('5. ANTI-DOWNSHIFT INVARIANT (MIDDLEWARE): invalid privileged secret with simultaneous valid learner credentials CANNOT downshift', async () => {
    const req = new NextRequest('https://api.internal.test/api/protected/resource', {
      headers: {
        'x-internal-secret': 'ATTACKER_FORGED_SECRET',
        'authorization': 'Bearer valid.learner.jwt.token',
        'cookie': 'accessToken=valid.learner.jwt.token',
        'x-user-id': 'victim-learner-id',
        'x-brand': 'skillup',
      },
    });

    const res = validateRequest(req);
    expect(res.error).toBeDefined();
    expect(res.error?.status).toBe(401);
    const body = await res.error?.json();
    expect(body.message).toBe('Invalid internal service secret');

    const gatewayRes = validateGatewaySecret(req);
    expect(gatewayRes).not.toBeNull();
    expect(gatewayRes?.status).toBe(403);
  });

  it('6. DIRECT ACCESS ENFORCEMENT: protected request without any internal or gateway secret is rejected (403)', async () => {
    const req = new NextRequest('https://api.internal.test/api/users/profile', {
      headers: {},
    });

    const gatewayRes = validateGatewaySecret(req);
    expect(gatewayRes).not.toBeNull();
    expect(gatewayRes?.status).toBe(403);
    const body = await gatewayRes?.json();
    expect(body.message).toContain('Direct API access is not allowed');
  });

  it('7. SECURITY INVARIANT: bad internal key is denied with a real signed learner token', async () => {
    const testSecret = new TextEncoder().encode('b08g-disposable-secret-32b-key!');
    const tokenService = new TokenService(testSecret, testSecret, testSecret);
    container.register(TokenService, tokenService);
    TokenService.setInstance(tokenService);

    const refresh = 'disposable-device-a-refresh';
    const sessionLookup = vi.fn().mockResolvedValue({ id: 'device-a' });
    container.register(UserRepository, { findActiveUserWithRoles: vi.fn().mockResolvedValue({ id: 'test-learner-1', roles: ['student'], deletedAt: null, isBlocked: false }) } as unknown as UserRepository);
    container.register(TokenRepository, { findValidSession: sessionLookup } as unknown as TokenRepository);
    const learnerToken = await tokenService.generateAccessToken({
      userId: 'test-learner-1',
      brand: 'realtutorialhub',
      tokenType: 'user',
      aud: 'user',
      isAdmin: false,
      roles: ['student'],
      sessionBinding: await tokenService.hashToken(refresh),
    });

    // Access-only replay remains denied; only the exact persisted cookie pair passes.
    const replay = await proxy(new NextRequest('https://realtutorialhub.test/api/export/status/test-job', { headers: { authorization: `Bearer ${learnerToken}` } }));
    expect(replay.status).toBe(401);
    expect(sessionLookup).not.toHaveBeenCalled();

    // Without an internal key, the valid current device pair passes.
    const reqNormal = new NextRequest('https://realtutorialhub.test/api/export/status/test-job', {
      headers: {
        authorization: `Bearer ${learnerToken}`,
        cookie: `refreshToken=${refresh}`,
      },
    });
    const resNormal = await proxy(reqNormal);
    expect(resNormal.status).toBe(200);
    expect(sessionLookup).toHaveBeenCalledWith({ userId: 'test-learner-1', refreshTokenHash: await tokenService.hashToken(refresh) });
    sessionLookup.mockClear();

    // An explicit invalid internal key must not fall through to learner authentication.
    const reqWithBadKey = new NextRequest('https://realtutorialhub.test/api/export/status/test-job', {
      headers: {
        authorization: `Bearer ${learnerToken}`,
        cookie: `refreshToken=${refresh}`,
        'x-internal-key': 'explicit-wrong-internal-key',
      },
    });
    const resWithBadKey = await proxy(reqWithBadKey);
    // Explicitly rejected privileged credentials must fail closed before learner fallback.
    expect(resWithBadKey.status).toBe(403);
    expect(sessionLookup).not.toHaveBeenCalled();
  });

  it('distinguishes absent, valid, empty and unconfigured internal keys', async () => {
    const run = async (key?: string) => {
      const headers = new Headers({ 'x-request-id': 'request-control', 'x-session-id': 'session-control' });
      if (key !== undefined) headers.set('x-internal-key', key);
      return proxy(new NextRequest('https://api.internal.test/api/export/status/job', { headers }));
    };
    expect((await run()).status).toBe(401);
    expect((await run(TEST_INTERNAL_SECRET)).status).toBe(200);
    const empty = await run('');
    expect(empty.status).toBe(403);
    expect(empty.headers.get('x-request-id')).toBe('request-control');
    expect(empty.headers.get('x-session-id')).toBe('session-control');
    delete process.env.INTERNAL_API_KEY;
    expect((await run(TEST_INTERNAL_SECRET)).status).toBe(403);
    process.env.INTERNAL_API_KEY = '';
    expect((await run('')).status).toBe(403);
    expect((await proxy(new NextRequest('https://api.internal.test/api/health', { headers: { 'x-internal-key': 'wrong' } }))).status).toBe(200);
  });
});
