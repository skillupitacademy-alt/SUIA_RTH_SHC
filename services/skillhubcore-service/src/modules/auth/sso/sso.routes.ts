import { Hono } from 'hono';
import { z } from 'zod';

import { requireAuth, requireRoles } from '@/middleware/verify-jwt';
import { SsoAccessError, SsoService } from './sso.service';

const platformSchema = z.object({
  platform: z.enum(['realtutorialhub', 'skillup']),
  action: z.enum(['grant', 'revoke']).default('grant'),
});
const personIdSchema = z.string().uuid();

export const createSsoRoutes = (ssoService = new SsoService()): Hono => {
  const app = new Hono();
  app.onError((error, c) => {
    const safe = error instanceof SsoAccessError ? error : new SsoAccessError(503);
    return c.json({ error: safe.message }, safe.status, { 'Cache-Control': 'private, no-store' });
  });
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'private, no-store');
    await next();
  });
  app.use('*', requireAuth, requireRoles(['admin', 'super_admin']));

  app.get('/:userId/platforms', async c => {
    const id = personIdSchema.safeParse(c.req.param('userId'));
    if (!id.success) return c.json({ error: 'Invalid request' }, 400);
    const platforms = await ssoService.administerAccess(c.get('authUser'), id.data, 'read');
    return c.json({ userId: id.data, platforms });
  });

  app.post('/:userId/platforms', async c => {
    const id = personIdSchema.safeParse(c.req.param('userId'));
    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid request' }, 400); }
    const parsed = platformSchema.safeParse(body);
    if (!id.success || !parsed.success) return c.json({ error: 'Invalid request' }, 400);
    const platforms = await ssoService.administerAccess(c.get('authUser'), id.data, parsed.data.action, parsed.data.platform);
    return c.json({ userId: id.data, action: parsed.data.action, platform: parsed.data.platform, platforms });
  });
  return app;
};
