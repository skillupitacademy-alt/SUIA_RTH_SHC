import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { proxy } from '@/proxy';

describe('Proxy Page Security — Direct HTTP, RSC, HEAD & API Preservations', () => {
  const secretKey = new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'test-admin-secret-at-least-32-chars-long!!'
  );

  async function createValidAdminToken(roles = ['admin']) {
    return new SignJWT({
      sub: 'admin-uuid-1',
      originalUserId: 'admin-uuid-1',
      shadowUserId: 'admin-uuid-1',
      email: 'admin@skillhubcore.in',
      roles,
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: 'shc-admin',
      iss: 'skillhubcore.in',
      isAdmin: true,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secretKey);
  }

  async function createStudentToken() {
    return new SignJWT({
      sub: 'student-uuid-1',
      originalUserId: 'student-uuid-1',
      shadowUserId: 'student-uuid-1',
      email: 'student@example.com',
      roles: ['student'],
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: 'shc-admin',
      iss: 'skillhubcore.in',
      isAdmin: false,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secretKey);
  }

  function createRequest(
    path: string,
    options: {
      method?: string;
      token?: string;
      headers?: Record<string, string>;
    } = {}
  ) {
    const { method = 'GET', token, headers = {} } = options;
    const reqHeaders = new Headers(headers);
    if (token) {
      reqHeaders.set('cookie', `accessToken=${token}`);
    }
    return new NextRequest(`https://admin.skillhubcore.in${path}`, {
      method,
      headers: reqHeaders,
    });
  }

  // --- Task 22: Direct Browser HTML & HEAD Requests ---
  describe('Direct Browser HTML & HEAD Requests', () => {
    it('redirects unauthenticated HTML request on protected page to /login with sanitized redirect', async () => {
      const req = createRequest('/dashboard');
      const res = await proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login');
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });

    it('redirects unauthenticated HEAD request on protected page to /login', async () => {
      const req = createRequest('/marketing', { method: 'HEAD' });
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });

    it('admits authenticated admin HTML request with private, no-store response header', async () => {
      const token = await createValidAdminToken();
      const req = createRequest('/dashboard', { token });
      const res = await proxy(req);

      // In Next.js middleware, NextResponse.next() returns status 200
      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });

    it('admits authenticated admin HEAD request with private, no-store response header', async () => {
      const token = await createValidAdminToken();
      const req = createRequest('/audit', { method: 'HEAD', token });
      const res = await proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });
  });

  // --- Task 23: RSC & Prefetch Request Admission ---
  describe('React Server Component (RSC) and Prefetch Requests', () => {
    it('blocks unauthenticated RSC payload requests (rsc: 1) and redirects to /login', async () => {
      const req = createRequest('/questions', {
        headers: { rsc: '1' },
      });
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });

    it('blocks unauthenticated router prefetch requests and redirects to /login', async () => {
      const req = createRequest('/tools/project-llm', {
        headers: { 'next-router-prefetch': '1' },
      });
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });

    it('admits authenticated admin RSC payload requests safely', async () => {
      const token = await createValidAdminToken();
      const req = createRequest('/questions', {
        token,
        headers: { rsc: '1' },
      });
      const res = await proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });
  });

  // --- Task 24: Failure Responses, Distinct 401/403/Forbidden ---
  describe('Distinct Outcomes: Unauthenticated vs Forbidden', () => {
    it('redirects forbidden student principal to /forbidden (distinct from /login)', async () => {
      const studentToken = await createStudentToken();
      const req = createRequest('/dashboard', { token: studentToken });
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/forbidden');
      expect(res.headers.get('location')).not.toContain('/login');
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });

    it('preserves query parameters safely in redirect parameter without open redirect bypass', async () => {
      const req = createRequest('/questions?page=2&sortBy=created_at');
      const res = await proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login?redirect=');
      expect(location).toContain('page%3D2');
    });
  });

  // --- Task 26: Sensitive Operation Boundaries & API Preservation ---
  describe('API Route & Public Asset Preservation', () => {
    it('allows public health endpoint without authentication', async () => {
      const req = createRequest('/api/health');
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });

    it('allows public /login page without authentication', async () => {
      const req = createRequest('/login');
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });

    it('allows public /forbidden page without authentication', async () => {
      const req = createRequest('/forbidden');
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });

    it('allows public root redirect page without authentication', async () => {
      const req = createRequest('/');
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });

    it('enforces API route guards on /api/admin/* endpoints', async () => {
      const req = createRequest('/api/admin/domains');
      const res = await proxy(req);

      // Unauthenticated API request must receive HTTP 401 JSON, not a 307 page redirect
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('enforces mutation origin checks on /api/auth/login', async () => {
      const req = createRequest('/api/auth/login', {
        method: 'POST',
        headers: { origin: 'https://evil-untrusted-origin.com' },
      });
      const res = await proxy(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Untrusted request origin');
    });
  });
});

