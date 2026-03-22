import { Hono } from 'hono';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import { createRateLimiter } from '@/middleware/rate-limit';
import { requireAuth } from '@/middleware/verify-jwt';
import { TokenService } from './token.service';
import type { AuthService } from './auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  platform: z.enum(['realtutorialhub', 'skillup', 'both']),
  role: z.enum(['student', 'faculty', 'admin']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  platform: z.enum(['realtutorialhub', 'skillup', 'both']),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const createAuthRoutes = (authService: AuthService): Hono => {
  const app = new Hono();
  const registerLimiter = createRateLimiter('register', 10, 60 * 60);
  const loginLimiter = createRateLimiter('login', 5, 60);
  const refreshLimiter = createRateLimiter('refresh', 30, 60);

  app.post('/register', async (c) => {
    const parsed = registerSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const limited = await registerLimiter.check(ip);
    if (!limited.allowed) {
      return c.json({ error: 'Too many registrations', code: 'RATE_LIMITED' }, 429, {
        'Retry-After': String(limited.retryAfterSeconds),
      });
    }

    try {
      const result = await authService.register(parsed.data);
      return c.json(result, 201);
    } catch (error) {
      logger.error({ error }, 'register failed');
      return c.json({ error: error instanceof Error ? error.message : 'Register failed', code: 'CONFLICT' }, 409);
    }
  });

  app.post('/login', async (c) => {
    const parsed = loginSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const limited = await loginLimiter.check(ip);
    if (!limited.allowed) {
      return c.json({ error: 'Too many login attempts', code: 'RATE_LIMITED' }, 429, {
        'Retry-After': String(limited.retryAfterSeconds),
      });
    }

    try {
      const result = await authService.login(parsed.data);
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      const status = message.includes('suspended') ? 403 : 401;
      logger.warn({ error, ip }, 'login failed');
      return c.json({ error: message, code: status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED' }, status);
    }
  });

  app.post('/refresh', async (c) => {
    const parsed = refreshSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const limited = await refreshLimiter.check(ip);
    if (!limited.allowed) {
      return c.json({ error: 'Too many refresh attempts', code: 'RATE_LIMITED' }, 429, {
        'Retry-After': String(limited.retryAfterSeconds),
      });
    }

    try {
      const result = await authService.refresh(parsed.data.refreshToken);
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refresh failed';
      const compromised = message.toLowerCase().includes('compromised');
      if (compromised) {
        return new Response(JSON.stringify({ error: message, code: 'SESSION_COMPROMISED' }), {
          status: 440,
          headers: { 'content-type': 'application/json' },
        });
      }
      return c.json({ error: message, code: 'UNAUTHORIZED' }, 401);
    }
  });

  app.post('/logout', async (c) => {
    const parsed = refreshSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const tokenService = new TokenService();
    const payload = await tokenService.verifyRefreshToken(parsed.data.refreshToken);
    await authService.logout(payload.sub, payload.family);
    return c.json({ success: true });
  });

  app.get('/me', requireAuth, async (c) => {
    return c.json({ user: c.get('authUser') });
  });

  return app;
};
