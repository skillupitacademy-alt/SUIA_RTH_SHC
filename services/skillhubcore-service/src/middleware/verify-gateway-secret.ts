import { createMiddleware } from 'hono/factory';

export const requireGatewaySecret = createMiddleware(async (c, next) => {
  const INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET;
  if (typeof INTERNAL_GATEWAY_SECRET !== 'string' || INTERNAL_GATEWAY_SECRET.length === 0) {
    await next();
    return;
  }

  const gatewaySecret = c.req.header('x-gateway-secret');
  if (gatewaySecret !== INTERNAL_GATEWAY_SECRET) {
    return c.json({ error: 'Forbidden', code: 'FORBIDDEN' }, 403);
  }

  await next();
});
