import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import { logger } from '@/lib/logger';
import { TokenService } from '../modules/auth/token.service';

declare module 'hono' {
  interface ContextVariableMap {
    authUser: {
      id: string;
      roles: Array<'student' | 'faculty' | 'admin' | 'super_admin'>;
      subscriptions: string[];
      platforms: Array<'realtutorialhub' | 'skillup'>;
    };
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const token =
    c.req.header('authorization')?.replace('Bearer ', '') ??
    c.req.header('Authorization')?.replace('Bearer ', '');

  if (token === undefined || token.length === 0) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }

  try {
    const payload = await new TokenService().verifyAccessToken(token);
    if (payload.platforms === undefined || payload.platforms.length === 0) {
      return c.json({ error: 'Token missing platform claim', code: 'UNAUTHORIZED' }, 401);
    }
    c.set('authUser', {
      id: payload.sub,
      roles: payload.roles,
      subscriptions: payload.subscriptions,
      platforms: payload.platforms,
    });
    await next();
  } catch (error) {
    logger.warn({ error }, 'JWT verification failed');
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }
});

export const requireRoles = (allowedRoles: Array<'student' | 'faculty' | 'admin' | 'super_admin'>) =>
  createMiddleware(async (c, next) => {
    const authUser = c.get('authUser');
    if (
      authUser === undefined ||
      !authUser.roles.some((role) =>
        allowedRoles.includes(role as 'student' | 'faculty' | 'admin' | 'super_admin')
      )
    ) {
      return c.json({ error: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    await next();
  });

export function requirePlatform(platform: 'realtutorialhub' | 'skillup'): MiddlewareHandler {
  return async (c, next) => {
    const authUser = c.get('authUser');

    if (authUser === undefined) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!authUser.platforms.includes(platform)) {
      return c.json({ error: 'Forbidden: platform access denied' }, 403);
    }

    await next();
  };
}
