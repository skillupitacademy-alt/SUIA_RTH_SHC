import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { logger } from '@/lib/logger';
import { requireGatewaySecret } from '@/middleware/verify-gateway-secret';
import { createAuthRoutes } from '@/modules/auth/auth.routes';
import { AuthService } from '@/modules/auth/auth.service';
import { PasswordService } from '@/modules/auth/password.service';
import { TokenService } from '@/modules/auth/token.service';
import { createHierarchyRoutes } from '@/modules/hierarchy/hierarchy.routes';
import { HierarchyService } from '@/modules/hierarchy/hierarchy.service';
import { DrizzleUserRepository } from '@/modules/user/user.repository';
import { cache } from '@/lib/cache';

export const createApp = () => {
  const app = new Hono();
  const tokenService = new TokenService();
  const passwordService = new PasswordService();
  const userRepo = new DrizzleUserRepository();
  const authService = new AuthService(userRepo, tokenService, passwordService, cache);
  const hierarchyService = new HierarchyService();

  app.use('*', requireGatewaySecret);
  app.get('/healthz', (c) => c.json({ status: 'ok', service: 'skillhubcore', ts: Date.now() }));
  app.get('/healthz/', (c) => c.json({ status: 'ok', service: 'skillhubcore', ts: Date.now() }));
  app.route('/auth', createAuthRoutes(authService));
  app.route('/api/hierarchy', createHierarchyRoutes(hierarchyService));

  return app;
};

export const app = createApp();

export const startServer = (port = Number(process.env.PORT ?? 8080)) => {
  logger.info({ port }, 'starting skillhubcore-service');
  serve({
    fetch: app.fetch,
    port,
  });
};

if (process.env.SKILLHUBCORE_DISABLE_AUTOSTART !== '1' && process.env.NODE_ENV !== 'test') {
  startServer();
}
