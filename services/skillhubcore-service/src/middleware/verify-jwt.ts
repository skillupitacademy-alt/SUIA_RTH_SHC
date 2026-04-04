import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import { TokenService } from '@quiz/auth';

import { logger } from '@/lib/logger';

declare module 'hono' {
  interface ContextVariableMap {
    authUser: {
      id: string;
      shadowUserId: string;
      originalUserId: string;
      roles: Array<'student' | 'faculty' | 'admin' | 'super_admin'>;
      subscriptions: string[];
      platforms: Array<'realtutorialhub' | 'skillup'>;
      brand?: 'realtutorialhub' | 'skillup';
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
    const payload = await TokenService.verifySkillHubCoreJWT(token);
    if (payload.platforms === undefined || payload.platforms.length === 0) {
      return c.json({ error: 'Token missing platform claim', code: 'UNAUTHORIZED' }, 401);
    }
    const requestedBrandHeader = c.req.header('x-platform') ?? c.req.header('x-brand');
    const requestedBrand = requestedBrandHeader === 'realtutorialhub' || requestedBrandHeader === 'skillup'
      ? requestedBrandHeader
      : undefined;
    const activeBrand = requestedBrand !== undefined && payload.platforms.includes(requestedBrand)
      ? requestedBrand
      : payload.platforms[0];
    const shadowUserId =
      typeof payload.shadowUserId === 'string' && payload.shadowUserId.trim().length > 0
        ? payload.shadowUserId
        : undefined;
    const originalUserId =
      typeof payload.originalUserId === 'string' && payload.originalUserId.trim().length > 0
        ? payload.originalUserId
        : undefined;
    if (shadowUserId === undefined || originalUserId === undefined) {
      return c.json({ error: 'Token missing identity bridge claims', code: 'UNAUTHORIZED' }, 401);
    }
    c.set('authUser', {
      id: shadowUserId,
      shadowUserId,
      originalUserId,
      roles: payload.roles as Array<'student' | 'faculty' | 'admin' | 'super_admin'>,
      subscriptions: payload.subscriptions,
      platforms: payload.platforms,
      brand: activeBrand,
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
      return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }

    if (authUser.roles.includes('super_admin')) {
      await next();
      return;
    }

    if (!authUser.platforms.includes(platform)) {
      return c.json({ error: 'Cross-brand access denied', code: 'FORBIDDEN' }, 403);
    }

    await next();
  };
}
