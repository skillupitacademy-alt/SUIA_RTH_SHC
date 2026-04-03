import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';

import { authenticateRequest, detectRequestPortal } from '../auth';

async function createToken(
  secret: string,
  sub: string,
  roles: string[],
  extra: Record<string, unknown> = {},
) {
  return new SignJWT({
    roles,
    subscriptions: [],
    ...extra,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .sign(new TextEncoder().encode(secret));
}

describe('auth middleware', () => {
  it('detects admin portal from admin routes', () => {
    const request = new Request('https://api.realtutorialhub.com/admin/users');
    expect(detectRequestPortal(request, { requireRole: 'admin', upstreamKey: 'EXAM_SERVICE_URL', prefix: '/admin' })).toBe('admin');
  });

  it('uses fixed portal identity headers instead of hostname inference', () => {
    const request = new Request('https://admin.realtutorialhub.com/dashboard', {
      headers: {
        'x-portal-identity': 'user',
      },
    });

    expect(detectRequestPortal(request, { prefix: '/dashboard' })).toBe('user');
  });

  it('accepts accessToken cookies for user routes', async () => {
    const secret = 'test-secret';
    const token = await createToken(secret, 'user-1', ['student'], {
      tokenType: 'user',
      shadowUserId: 'shadow-user-1',
      originalUserId: 'brand-user-1',
    });
    const request = new Request('https://api.realtutorialhub.com/dashboard', {
      headers: {
        cookie: `accessToken=${encodeURIComponent(token)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { prefix: '/dashboard' });

    expect('payload' in result).toBe(true);
    if ('payload' in result) {
      expect(result.portal).toBe('user');
      expect(result.tokenSource).toBe('accessToken');
      expect(result.payload.sub).toBe('shadow-user-1');
      expect(result.payload.shadowUserId).toBe('shadow-user-1');
      expect(result.payload.originalUserId).toBe('brand-user-1');
      expect(result.payload.roles).toContain('student');
    }
  });

  it('prefers admin_accessToken cookies for admin routes', async () => {
    const secret = 'test-secret';
    const adminToken = await createToken(secret, 'shadow-admin-1', ['ADMIN'], {
      tokenType: 'admin',
      shadowUserId: 'shadow-admin-1',
      originalUserId: 'brand-admin-1',
    });
    const request = new Request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(adminToken)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'EXAM_SERVICE_URL', prefix: '/admin' });

    expect('payload' in result).toBe(true);
    if ('payload' in result) {
      expect(result.portal).toBe('admin');
      expect(result.tokenSource).toBe('admin_accessToken');
      expect(result.payload.sub).toBe('shadow-admin-1');
      expect(result.payload.shadowUserId).toBe('shadow-admin-1');
      expect(result.payload.originalUserId).toBe('brand-admin-1');
      expect(result.payload.roles).toContain('admin');
    }
  });

  it('rejects missing admin cookies on admin routes', async () => {
    const secret = 'test-secret';
    const request = new Request('https://api.realtutorialhub.com/admin/users');

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'EXAM_SERVICE_URL', prefix: '/admin' });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('rejects user tokens on admin routes', async () => {
    const secret = 'test-secret';
    const userToken = await createToken(secret, 'shadow-user-2', ['student'], {
      tokenType: 'user',
      shadowUserId: 'shadow-user-2',
      originalUserId: 'brand-user-2',
    });
    const request = new Request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(userToken)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'EXAM_SERVICE_URL', prefix: '/admin' });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it('rejects admin cookies with mismatched tokenType claims', async () => {
    const secret = 'test-secret';
    const token = await createToken(secret, 'shadow-admin-4', ['admin'], {
      tokenType: 'user',
      shadowUserId: 'shadow-admin-4',
      originalUserId: 'brand-admin-4',
    });
    const request = new Request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(token)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'EXAM_SERVICE_URL', prefix: '/admin' });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it('rejects missing tokens', async () => {
    const request = new Request('https://api.realtutorialhub.com/tutorial/lessons/1');
    const result = await authenticateRequest(request, {
      JWT_SECRET: 'test-secret',
    } as never, { prefix: '/tutorial' });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('rejects mismatched tokenType claims when present', async () => {
    const secret = 'test-secret';
    const token = await createToken(secret, 'shadow-admin-3', ['admin'], {
      tokenType: 'user',
      shadowUserId: 'shadow-admin-3',
      originalUserId: 'brand-admin-3',
    });
    const request = new Request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(token)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'EXAM_SERVICE_URL', prefix: '/admin' });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });
});
