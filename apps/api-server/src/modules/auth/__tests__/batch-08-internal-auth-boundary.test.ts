import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { validateGatewaySecret } from '@/middleware/gateway-auth.middleware';
import { validateRequest } from '@/middleware/internal-auth.middleware';

/**
 * B08-G: Invalid Privileged/Internal Authentication Anti-Downshift Boundary
 *
 * Governing Architecture: audit/FinalAechitecture.md (Internal Service-to-Service Trust, Zero Downshift)
 * Governing Task: audit/W1.2_Gemini_Controlled_Batch_08_Task.md (B08-G)
 *
 * Verifies that:
 * 1. Valid internal service control succeeds with disposable process-local configuration.
 * 2. Public endpoints (e.g. /api/health, /api/auth/login) allow passage without internal secret.
 * 3. Invalid internal secret fails closed (401 in validateRequest, 403 in validateGatewaySecret).
 * 4. Invalid gateway secret fails closed (401 in validateRequest, 403 in validateGatewaySecret).
 * 5. Anti-Downshift Invariant: A request presenting an invalid privileged/internal credential
 *    cannot fall through / downshift into a less trusted identity, even if it simultaneously
 *    carries an otherwise valid learner session cookie or Bearer token.
 * 6. Direct API access without gateway or internal secret is rejected fail-closed (403 Forbidden).
 */

describe('B08-G: Invalid Privileged/Internal Authentication Boundary & Anti-Downshift', () => {
  const TEST_INTERNAL_SECRET = 'disposable-internal-api-secret-12345';
  const TEST_GATEWAY_SECRET = 'disposable-gateway-trust-secret-67890';

  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = TEST_INTERNAL_SECRET;
    process.env.INTERNAL_GATEWAY_SECRET = TEST_GATEWAY_SECRET;
    process.env.GATEWAY_TRUST_SECRET = TEST_GATEWAY_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
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

    // validateRequest returns auth context with authMode internal
    const result = validateRequest(req);
    expect(result.error).toBeUndefined();
    expect(result.context).toBeDefined();
    expect(result.context?.authMode).toBe('internal');
    expect(result.context?.userId).toBe('service-user-1');
    expect(result.context?.brand).toBe('skillup');

    // validateGatewaySecret returns null (allowed)
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

    // validateRequest rejects with 401
    const res = validateRequest(req);
    expect(res.error).toBeDefined();
    expect(res.error?.status).toBe(401);
    const body = await res.error?.json();
    expect(body.message).toBe('Invalid internal service secret');

    // validateGatewaySecret rejects with 403
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

    // validateRequest rejects with 401
    const res = validateRequest(req);
    expect(res.error).toBeDefined();
    expect(res.error?.status).toBe(401);
    const body = await res.error?.json();
    expect(body.message).toBe('Invalid gateway credentials');

    // validateGatewaySecret rejects with 403
    const gatewayRes = validateGatewaySecret(req);
    expect(gatewayRes).not.toBeNull();
    expect(gatewayRes?.status).toBe(403);
    const gatewayBody = await gatewayRes?.json();
    expect(gatewayBody.message).toBe('Invalid gateway secret');
  });

  it('5. ANTI-DOWNSHIFT INVARIANT: invalid privileged secret with simultaneous valid learner credentials CANNOT downshift', async () => {
    // Caller attempts privileged call with BAD internal secret, but ALSO attaches a valid learner session cookie and Bearer token
    const req = new NextRequest('https://api.internal.test/api/protected/resource', {
      headers: {
        'x-internal-secret': 'ATTACKER_FORGED_SECRET', // Invalid privileged credential
        'authorization': 'Bearer valid.learner.jwt.token', // Legitimate learner credential
        'cookie': 'accessToken=valid.learner.jwt.token',
        'x-user-id': 'victim-learner-id',
        'x-brand': 'skillup',
      },
    });

    // CRITICAL ANTI-DOWNSHIFT CHECK:
    // The request MUST be rejected immediately due to bad internal secret.
    // It must NOT ignore the bad secret and downshift to evaluating the learner session.
    const res = validateRequest(req);
    expect(res.error).toBeDefined();
    expect(res.error?.status).toBe(401);
    const body = await res.error?.json();
    expect(body.message).toBe('Invalid internal service secret');

    // In gateway middleware, it also fails closed with 403
    const gatewayRes = validateGatewaySecret(req);
    expect(gatewayRes).not.toBeNull();
    expect(gatewayRes?.status).toBe(403);
  });

  it('6. DIRECT ACCESS ENFORCEMENT: protected request without any internal or gateway secret is rejected (403)', async () => {
    const req = new NextRequest('https://api.internal.test/api/users/profile', {
      headers: {
        // No x-internal-secret
        // No x-gateway-secret
      },
    });

    const gatewayRes = validateGatewaySecret(req);
    expect(gatewayRes).not.toBeNull();
    expect(gatewayRes?.status).toBe(403);
    const body = await gatewayRes?.json();
    expect(body.message).toContain('Direct API access is not allowed');
  });
});

