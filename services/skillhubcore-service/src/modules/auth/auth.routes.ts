import { Hono } from 'hono';
import { z } from 'zod';
import { TokenService } from '@quiz/auth';

import { logger } from '@/lib/logger';
import { createRateLimiter } from '@/middleware/rate-limit';
import { requireAuth, requirePlatform } from '@/middleware/verify-jwt';
import type { AuthService } from './auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  platform: z.enum(['realtutorialhub', 'skillup']),
  role: z.enum(['student', 'faculty', 'admin']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  platform: z.enum(['realtutorialhub', 'skillup']),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  portalIdentity: z.enum(['admin', 'super_admin']).default('super_admin'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const callbackValidationSchema = z.object({
  accessToken: z.string().min(1),
  brand: z.enum(['realtutorialhub', 'skillup']),
});

export const createAuthRoutes = (authService: AuthService): Hono => {
  const app = new Hono();
  const registerLimiter = createRateLimiter('register', 10, 60 * 60);
  const loginLimiter = createRateLimiter('login', 5, 60);
  const adminLoginLimiter = createRateLimiter('admin_login', 5, 60);
  const refreshLimiter = createRateLimiter('refresh', 30, 60);
  const callbackLimiter = createRateLimiter('cross_domain_callback', 30, 60);

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

  app.post('/admin/login', async (c) => {
    const parsed = adminLoginSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const limited = await adminLoginLimiter.check(ip);
    if (!limited.allowed) {
      return c.json({ error: 'Too many login attempts', code: 'RATE_LIMITED' }, 429, {
        'Retry-After': String(limited.retryAfterSeconds),
      });
    }

    try {
      const result = await authService.loginAdmin(parsed.data.email, parsed.data.password);
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      const normalized = message.toLowerCase();
      const status = normalized.includes('suspended') || normalized.includes('forbidden') ? 403 : 401;
      logger.warn({ error, ip }, 'admin login failed');
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

  app.post('/callback/validate', async (c) => {
    const parsed = callbackValidationSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const limited = await callbackLimiter.check(ip);
    if (!limited.allowed) {
      return c.json({ error: 'Too many callback attempts', code: 'RATE_LIMITED' }, 429, {
        'Retry-After': String(limited.retryAfterSeconds),
      });
    }

    try {
      const validator = authService.createTokenValidatorService();
      const result = await validator.validateBrandAccessToken(parsed.data.accessToken, parsed.data.brand);
      return c.json(result);
    } catch (error) {
      logger.warn({ error, ip }, 'cross-domain callback validation failed');
      return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
  });

  app.post('/logout', async (c) => {
    const parsed = refreshSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const payload = await TokenService.verifySkillHubCoreRefreshToken(parsed.data.refreshToken);
    await authService.logout(payload.sub, payload.family);
    return c.json({ success: true });
  });

  app.get('/me', requireAuth, async (c) => {
    return c.json({ user: c.get('authUser') });
  });

  app.get('/sessions', requireAuth, async (c) => {
    const authUser = c.get('authUser') as { shadowUserId: string; brand?: 'realtutorialhub' | 'skillup' } | undefined;
    if (authUser === undefined) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const platform = authUser.brand ?? 'realtutorialhub';
    const sessions = await authService.getUserSessions(authUser.shadowUserId, platform);
    return c.json({ sessions });
  });

  app.delete('/sessions/:id', requireAuth, async (c) => {
    const authUser = c.get('authUser') as { shadowUserId: string; brand?: 'realtutorialhub' | 'skillup' } | undefined;
    if (authUser === undefined) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('id');
    const platform = authUser.brand ?? 'realtutorialhub';
    try {
      await authService.revokeSession(authUser.shadowUserId, sessionId, platform);
      return c.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        return c.json({ error: error.message }, 404);
      }
      logger.error({ error, userId: authUser.shadowUserId, sessionId }, 'revoke session failed');
      return c.json({ error: 'Failed to revoke session' }, 500);
    }
  });

  app.delete('/sessions', requireAuth, async (c) => {
    const authUser = c.get('authUser') as { shadowUserId: string; brand?: 'realtutorialhub' | 'skillup' } | undefined;
    if (authUser === undefined) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const platform = authUser.brand ?? 'realtutorialhub';
    await authService.revokeAllSessions(authUser.shadowUserId, platform);
    return c.json({ success: true });
  });

  app.use('/rth/*', requireAuth, requirePlatform('realtutorialhub'));
  app.use('/skillup/*', requireAuth, requirePlatform('skillup'));

  return app;
};
