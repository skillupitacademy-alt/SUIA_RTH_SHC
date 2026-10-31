import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFacultyUpstreamHeaders, type FacultyIdentity } from '../lib/faculty-api';
import { proxy, stripClientHeaders } from '../proxy';

const mocks = vi.hoisted(() => ({
  verifyUserAccessToken: vi.fn(),
}));

vi.mock('@quiz/auth', () => ({
  TokenService: {
    verifyUserAccessToken: mocks.verifyUserAccessToken,
  },
}));

describe('FACULTY-BFF-AUTH-01: Faculty BFF Brand Binding & Identity Sanitization', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  describe('stripClientHeaders', () => {
    it('strips all spoofable client identity and gateway headers', () => {
      const incomingHeaders = new Headers({
        'content-type': 'application/json',
        'x-user-id': 'spoofed-user',
        'x-shadow-user-id': 'spoofed-shadow',
        'x-original-user-id': 'spoofed-orig',
        'x-brand': 'realtutorialhub',
        'x-platform': 'realtutorialhub',
        'x-user-roles': 'super_admin',
        'x-gateway-secret': 'spoofed-gateway-secret',
        'x-internal-secret': 'spoofed-internal-secret',
        'authorization': 'Bearer some-token',
      });

      const cleaned = stripClientHeaders(incomingHeaders);

      expect(cleaned.get('content-type')).toBe('application/json');
      expect(cleaned.get('authorization')).toBe('Bearer some-token');
      expect(cleaned.get('x-user-id')).toBeNull();
      expect(cleaned.get('x-shadow-user-id')).toBeNull();
      expect(cleaned.get('x-original-user-id')).toBeNull();
      expect(cleaned.get('x-brand')).toBeNull();
      expect(cleaned.get('x-platform')).toBeNull();
      expect(cleaned.get('x-user-roles')).toBeNull();
      expect(cleaned.get('x-gateway-secret')).toBeNull();
      expect(cleaned.get('x-internal-secret')).toBeNull();
    });
  });

  describe('proxy brand & token binding', () => {
    it('redirects to login when token has invalid or missing brand', async () => {
      mocks.verifyUserAccessToken.mockResolvedValueOnce({
        sub: 'usr-1',
        userId: 'usr-1',
        shadowUserId: 'usr-1',
        originalUserId: 'usr-1',
        roles: ['faculty'],
        // brand missing or invalid
        brand: 'unsupported-brand',
      });

      const req = new NextRequest('http://localhost/faculty/dashboard', {
        headers: {
          cookie: 'accessToken=valid-token-unsupported-brand',
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307); // Redirect to login
      expect(res.headers.get('location')).toContain('/login');
    });

    it('injects verified token brand and identity headers for authorized faculty', async () => {
      mocks.verifyUserAccessToken.mockResolvedValueOnce({
        sub: 'faculty-shadow-1',
        userId: 'faculty-orig-1',
        shadowUserId: 'faculty-shadow-1',
        originalUserId: 'faculty-orig-1',
        roles: ['faculty'],
        brand: 'realtutorialhub',
      });

      const req = new NextRequest('http://localhost/faculty/dashboard', {
        headers: {
          cookie: 'accessToken=valid-token',
          // Client attempts to spoof brand as skillup
          'x-brand': 'skillup',
          'x-user-id': 'attacker',
        },
      });

      const res = await proxy(req);
      // Response headers (and forwarded request headers) must reflect verified claims
      expect(res.status).toBe(200);
      expect(res.headers.get('x-brand')).toBe('realtutorialhub');
      expect(res.headers.get('x-platform')).toBe('realtutorialhub');
      expect(res.headers.get('x-user-id')).toBe('faculty-shadow-1');
      expect(res.headers.get('x-shadow-user-id')).toBe('faculty-shadow-1');
      expect(res.headers.get('x-original-user-id')).toBe('faculty-orig-1');
      expect(res.headers.get('x-user-roles')).toBe('faculty');
    });

    it('denies access with 403 when user lacks required faculty role', async () => {
      mocks.verifyUserAccessToken.mockResolvedValueOnce({
        sub: 'student-1',
        userId: 'student-1',
        shadowUserId: 'student-1',
        originalUserId: 'student-1',
        roles: ['student'],
        brand: 'skillup',
      });

      const req = new NextRequest('http://localhost/faculty/dashboard', {
        headers: {
          cookie: 'accessToken=student-token',
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });
  });

  describe('buildFacultyUpstreamHeaders', () => {
    it('forwards verified FacultyIdentity and injects gateway secret', () => {
      process.env.GATEWAY_TRUST_SECRET = 'verified-gateway-secret';

      const identity: FacultyIdentity = {
        userId: 'faculty-user-1',
        shadowUserId: 'faculty-shadow-1',
        originalUserId: 'faculty-orig-1',
        brand: 'skillup',
        roles: ['faculty'],
      };

      const sourceHeaders = new Headers({
        cookie: 'accessToken=secret',
      });

      const upstream = buildFacultyUpstreamHeaders(sourceHeaders, identity);

      expect(upstream.get('x-gateway-secret')).toBe('verified-gateway-secret');
      expect(upstream.get('x-brand')).toBe('skillup');
      expect(upstream.get('x-platform')).toBe('skillup');
      expect(upstream.get('x-user-id')).toBe('faculty-user-1');
      expect(upstream.get('x-shadow-user-id')).toBe('faculty-shadow-1');
      expect(upstream.get('x-original-user-id')).toBe('faculty-orig-1');
      expect(upstream.get('x-user-roles')).toBe('faculty');
      expect(upstream.get('cookie')).toBe('accessToken=secret');
    });
  });
});
