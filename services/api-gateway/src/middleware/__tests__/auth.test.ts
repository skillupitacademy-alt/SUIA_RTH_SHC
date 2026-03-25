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
    expect(detectRequestPortal(request, { requireRole: 'admin', upstreamKey: 'ADMIN_URL', prefix: '/admin' })).toBe('admin');
  });

  it('accepts accessToken cookies for user routes', async () => {
    const secret = 'test-secret';
    const token = await createToken(secret, 'user-1', ['student'], { tokenType: 'user' });
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
      expect(result.payload.sub).toBe('user-1');
      expect(result.payload.roles).toContain('student');
    }
  });

  it('prefers admin_accessToken cookies for admin routes', async () => {
    const secret = 'test-secret';
    const adminToken = await createToken(secret, 'admin-1', ['ADMIN'], { tokenType: 'admin' });
    const request = new Request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(adminToken)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'ADMIN_URL', prefix: '/admin' });

    expect('payload' in result).toBe(true);
    if ('payload' in result) {
      expect(result.portal).toBe('admin');
      expect(result.tokenSource).toBe('admin_accessToken');
      expect(result.payload.sub).toBe('admin-1');
      expect(result.payload.roles).toContain('admin');
    }
  });

  it('rejects missing admin cookies on admin routes', async () => {
    const secret = 'test-secret';
    const request = new Request('https://api.realtutorialhub.com/admin/users');

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'ADMIN_URL', prefix: '/admin' });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('rejects user tokens on admin routes', async () => {
    const secret = 'test-secret';
    const userToken = await createToken(secret, 'user-2', ['student'], { tokenType: 'user' });
    const request = new Request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(userToken)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'ADMIN_URL', prefix: '/admin' });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it('rejects admin cookies with mismatched tokenType claims', async () => {
    const secret = 'test-secret';
    const token = await createToken(secret, 'admin-4', ['admin'], { tokenType: 'user' });
    const request = new Request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(token)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'ADMIN_URL', prefix: '/admin' });

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
    const token = await createToken(secret, 'admin-3', ['admin'], { tokenType: 'user' });
    const request = new Request('https://api.realtutorialhub.com/admin/users', {
      headers: {
        cookie: `admin_accessToken=${encodeURIComponent(token)}`,
      },
    });

    const result = await authenticateRequest(request, {
      JWT_SECRET: secret,
    } as never, { requireRole: 'admin', upstreamKey: 'ADMIN_URL', prefix: '/admin' });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });
});
