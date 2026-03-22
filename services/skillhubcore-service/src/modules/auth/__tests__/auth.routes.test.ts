import { describe, expect, it, vi } from 'vitest';

import { Hono } from 'hono';

import { createAuthRoutes } from '../auth.routes';
import { TokenService } from '../token.service';

const createAuthService = () => ({
  register: vi.fn(async (input: any) => ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 'user-1', email: input.email, roles: [input.role ?? 'student'], platforms: [input.platform], subscriptions: ['notes'] },
  })),
  login: vi.fn(async (input: any) => ({
    accessToken: `access-${input.email}`,
    refreshToken: `refresh-${input.email}`,
    user: { id: 'user-1', email: input.email, roles: ['student'], platforms: [input.platform], subscriptions: ['notes'] },
  })),
  refresh: vi.fn(async (refreshToken: string) => ({
    accessToken: `access-${refreshToken}`,
    refreshToken: `rotated-${refreshToken}`,
    user: { id: 'user-1', email: 'student@example.com', roles: ['student'], platforms: ['realtutorialhub'], subscriptions: ['notes'] },
  })),
  logout: vi.fn(async () => undefined),
});

describe('auth routes', () => {
  it('registers, logs in, refreshes, logs out, and reads me', async () => {
    const authService = createAuthService();
    const app = new Hono().route('/auth', createAuthRoutes(authService as any));
    const tokenService = new TokenService();
    const accessToken = await tokenService.signAccessToken('user-1', ['student'], ['notes']);
    const refreshToken = await tokenService.signRefreshToken('user-1', 'family-1');

    const registerResponse = await app.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@example.com', password: 'Password123!', platform: 'realtutorialhub' }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });
    expect(registerResponse.status).toBe(201);

    const loginResponse = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@example.com', password: 'Password123!', platform: 'realtutorialhub' }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });
    expect(loginResponse.status).toBe(200);

    const refreshResponse = await app.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    });
    expect(refreshResponse.status).toBe(200);

    const logoutResponse = await app.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: { 'content-type': 'application/json' },
    });
    expect(logoutResponse.status).toBe(200);

    const meResponse = await app.request('/auth/me', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(meResponse.status).toBe(200);

    expect(authService.register).toHaveBeenCalledTimes(1);
    expect(authService.login).toHaveBeenCalledTimes(1);
    expect(authService.refresh).toHaveBeenCalledTimes(1);
    expect(authService.logout).toHaveBeenCalledWith('user-1', 'family-1');
  });

  it('applies login rate limiting on the 6th attempt', async () => {
    const authService = createAuthService();
    const app = new Hono().route('/auth', createAuthRoutes(authService as any));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await app.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'student@example.com', password: 'Password123!', platform: 'realtutorialhub' }),
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
      });
      expect(response.status).toBe(200);
    }

    const limitedResponse = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@example.com', password: 'Password123!', platform: 'realtutorialhub' }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
    });
    expect(limitedResponse.status).toBe(429);
  });
});
