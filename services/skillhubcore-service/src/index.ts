import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { logger } from '@/lib/logger';
import { requireGatewaySecret } from '@/middleware/verify-gateway-secret';
import { createSsoRoutes } from '@/modules/auth/sso/sso.routes';
import { SsoService } from '@/modules/auth/sso/sso.service';
import { createSkillhubcoreEventRoutes } from '@/modules/events';
import { createHierarchyRoutes } from '@/modules/hierarchy/hierarchy.routes';
import { HierarchyService } from '@/modules/hierarchy/hierarchy.service';
import { createMarketingRoutes } from '@/modules/marketing';
import { DrizzleUserRepository } from '@/modules/user/user.repository';
import { SubscriptionService } from '@/modules/subscription/subscription.service';

export const createApp = () => {
  const app = new Hono();
  const userRepo = new DrizzleUserRepository();
  const subscriptionService = new SubscriptionService();
  const ssoService = new SsoService(userRepo);
  const hierarchyService = new HierarchyService();

  // Health check must be before the gateway secret middleware
  app.get('/healthz', (c) => c.json({ status: 'ok', service: 'skillhubcore', ts: Date.now() }));
  app.get('/healthz/', (c) => c.json({ status: 'ok', service: 'skillhubcore', ts: Date.now() }));

  app.route('/public/marketing', createMarketingRoutes());
  app.use('*', requireGatewaySecret);
  app.route('/admin/users', createSsoRoutes(ssoService));
  app.route('/consumers', createSkillhubcoreEventRoutes({ subscriptionService }));
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
