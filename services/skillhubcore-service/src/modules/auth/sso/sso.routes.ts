import { Hono } from 'hono';
import { z } from 'zod';

import { requireAuth, requireRoles } from '@/middleware/verify-jwt';
import { SsoService } from './sso.service';

const platformSchema = z.object({
  platform: z.enum(['realtutorialhub', 'skillup', 'both']),
  action: z.enum(['grant', 'revoke']).default('grant'),
});

export const createSsoRoutes = (ssoService = new SsoService()): Hono => {
  const app = new Hono();

  app.get('/:userId/platforms', requireAuth, requireRoles(['admin', 'super_admin']), async (c) => {
    const userId = c.req.param('userId');
    const platforms = await ssoService.getUserPlatforms(userId);
    return c.json({ userId, platforms });
  });

  app.post('/:userId/platforms', requireAuth, requireRoles(['admin', 'super_admin']), async (c) => {
    const userId = c.req.param('userId');
    const parsed = platformSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const platforms =
      parsed.data.action === 'grant'
        ? await ssoService.grantPlatformAccess(userId, parsed.data.platform)
        : await ssoService.revokePlatformAccess(userId, parsed.data.platform);

    return c.json({
      userId,
      action: parsed.data.action,
      platform: parsed.data.platform,
      platforms,
    });
  });

  return app;
};
