import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { blockDirectAccess, validateRequest } from '../internal-auth.middleware';

describe('GATEWAY-01: Gateway Trust & Fail-Closed Authentication', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateRequest - Gateway Mode Fail-Closed', () => {
    it('returns 503 Service Misconfigured when GATEWAY_TRUST_SECRET is unset', () => {
      delete process.env.GATEWAY_TRUST_SECRET;

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-user-id': 'usr-123',
          'x-brand': 'skillup',
        },
      });

      const result = validateRequest(req);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(503);
    });

    it('returns 401 Unauthorized when x-gateway-secret header is missing', async () => {
      process.env.GATEWAY_TRUST_SECRET = 'correct-gateway-secret';

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-user-id': 'usr-123',
          'x-brand': 'skillup',
        },
      });

      const result = validateRequest(req);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(401);
      const json = await result.error?.json();
      expect(json.error).toBe('Unauthorized');
      expect(json.message).toBe('Invalid gateway credentials');
    });

    it('returns 401 Unauthorized when x-gateway-secret is incorrect', async () => {
      process.env.GATEWAY_TRUST_SECRET = 'correct-gateway-secret';

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-user-id': 'usr-123',
          'x-brand': 'skillup',
          'x-gateway-secret': 'attacker-wrong-secret',
        },
      });

      const result = validateRequest(req);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(401);
    });

    it('accepts request when correct x-gateway-secret and valid brand are provided', () => {
      process.env.GATEWAY_TRUST_SECRET = 'correct-gateway-secret';

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-user-id': 'usr-123',
          'x-brand': 'realtutorialhub',
          'x-gateway-secret': 'correct-gateway-secret',
          'x-user-roles': 'student, user',
        },
      });

      const result = validateRequest(req);
      expect(result.error).toBeUndefined();
      expect(result.context).toBeDefined();
      expect(result.context?.userId).toBe('usr-123');
      expect(result.context?.brand).toBe('realtutorialhub');
      expect(result.context?.authMode).toBe('gateway');
      expect(result.context?.roles).toEqual(['student', 'user']);
    });

    it('rejects unsupported brand with 400 even if gateway secret is valid', async () => {
      process.env.GATEWAY_TRUST_SECRET = 'correct-gateway-secret';

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-user-id': 'usr-123',
          'x-brand': 'malicious-unsupported-brand',
          'x-gateway-secret': 'correct-gateway-secret',
        },
      });

      const result = validateRequest(req);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(400);
    });

    it('falls back to JWT when no gateway or internal headers are provided', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          authorization: 'Bearer jwt-token',
        },
      });

      const result = validateRequest(req);
      expect(result.error).toBeUndefined();
      expect(result.context).toBeUndefined(); // Allows JWT middleware to process
    });
  });

  describe('validateRequest - Internal Mode Fail-Closed', () => {
    it('returns 503 when INTERNAL_API_SECRET is unset in server environment', () => {
      delete process.env.INTERNAL_API_SECRET;

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-internal-secret': 'some-secret',
          'x-user-id': 'usr-123',
          'x-brand': 'skillup',
        },
      });

      const result = validateRequest(req);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(503);
    });

    it('returns 401 when internal secret is mismatched', () => {
      process.env.INTERNAL_API_SECRET = 'correct-internal-secret';

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-internal-secret': 'wrong-internal-secret',
          'x-user-id': 'usr-123',
          'x-brand': 'skillup',
        },
      });

      const result = validateRequest(req);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(401);
    });
  });

  describe('blockDirectAccess - Defense in Depth', () => {
    it('rejects bare x-user-id spoofing with 403 Forbidden', async () => {
      process.env.GATEWAY_TRUST_SECRET = 'correct-gateway-secret';

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-user-id': 'victim-user-id',
        },
      });

      const res = blockDirectAccess(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
      const json = await res?.json();
      expect(json.message).toContain('Direct API access with unverified gateway headers is blocked');
    });

    it('allows gateway access when x-gateway-secret matches GATEWAY_TRUST_SECRET', () => {
      process.env.GATEWAY_TRUST_SECRET = 'correct-gateway-secret';

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-user-id': 'usr-123',
          'x-gateway-secret': 'correct-gateway-secret',
        },
      });

      const res = blockDirectAccess(req);
      expect(res).toBeNull();
    });

    it('allows direct JWT cookie access', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          cookie: 'accessToken=jwt-token-value; other=123',
        },
      });

      const res = blockDirectAccess(req);
      expect(res).toBeNull();
    });

    it('allows direct Authorization Bearer header access', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          authorization: 'Bearer jwt-token-value',
        },
      });

      const res = blockDirectAccess(req);
      expect(res).toBeNull();
    });
  });
});
