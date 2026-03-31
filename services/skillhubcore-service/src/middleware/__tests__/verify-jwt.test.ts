import { SignJWT } from 'jose';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { requireAuth } from '../verify-jwt';

describe('requireAuth', () => {
  it('rejects tokens that omit the platform claim', async () => {
    const token = await new SignJWT({
      sub: 'user-1',
      roles: ['student'],
      subscriptions: [],
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('skillhubcore.in')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode('test-access-secret'));

    const app = new Hono();
    app.use('*', requireAuth);
    app.get('/protected', (c) => c.json({ ok: true }));

    const response = await app.request('http://localhost/protected', {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Token missing platform claim',
      code: 'UNAUTHORIZED',
    });
  });
});
