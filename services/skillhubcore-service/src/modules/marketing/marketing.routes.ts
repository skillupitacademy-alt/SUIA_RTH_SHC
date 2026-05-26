import { Hono } from 'hono';
import { z } from 'zod';

import {
  getFallbackMarketingBootstrapSnapshot,
  getFallbackMarketingContentSnapshot,
  getFallbackMarketingControlPlaneSnapshot,
} from '@quiz/marketing-site/content/fallback';
import {
  getMarketingCourseCatalogSnapshot,
  getMarketingCoursePageSnapshot,
} from '@quiz/marketing-site/content/courses';
import { buildMarketingControlPlane } from './marketing.registry';

const brandIdSchema = z.enum(['realtutorialhub', 'skillupitacademy']);

export const createMarketingRoutes = (): Hono => {
  const app = new Hono();

  app.get('/content/:brandId', async (c) => {
    const parsed = brandIdSchema.safeParse(c.req.param('brandId'));
    if (!parsed.success) {
      return c.json({ error: 'Invalid brandId', code: 'BAD_REQUEST' }, 400);
    }

    c.header('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800');
    return c.json(getFallbackMarketingContentSnapshot(parsed.data));
  });

  app.get('/control-plane/:brandId', async (c) => {
    const parsed = brandIdSchema.safeParse(c.req.param('brandId'));
    if (!parsed.success) {
      return c.json({ error: 'Invalid brandId', code: 'BAD_REQUEST' }, 400);
    }

    c.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=900');
    return c.json({
      ...getFallbackMarketingControlPlaneSnapshot(),
      ...buildMarketingControlPlane(parsed.data),
    });
  });

  app.get('/bootstrap/:brandId', async (c) => {
    const parsed = brandIdSchema.safeParse(c.req.param('brandId'));
    if (!parsed.success) {
      return c.json({ error: 'Invalid brandId', code: 'BAD_REQUEST' }, 400);
    }

    c.header('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800');
    return c.json(getFallbackMarketingBootstrapSnapshot(parsed.data));
  });

  app.get('/courses', async (c) => {
    c.header('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800');
    return c.json(getMarketingCourseCatalogSnapshot());
  });

  app.get('/courses/:slug', async (c) => {
    const snapshot = getMarketingCoursePageSnapshot(c.req.param('slug'));
    if (snapshot === null) {
      return c.json({ error: 'Course not found', code: 'NOT_FOUND' }, 404);
    }

    c.header('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800');
    return c.json(snapshot);
  });

  return app;
};
