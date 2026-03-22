import { Hono } from 'hono';
import { z } from 'zod';

import { requireAuth, requireRoles } from '@/middleware/verify-jwt';
import { HierarchyService } from './hierarchy.service';

const subtopicSchema = z.object({
  topicId: z.string().uuid(),
  subjectId: z.string().uuid(),
  domainId: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  difficultyLevels: z.array(z.string().min(1)).min(1),
});

export const createHierarchyRoutes = (hierarchyService = new HierarchyService()): Hono => {
  const app = new Hono();

  app.get('/domains', async (c) => {
    const data = await hierarchyService.getDomains();
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({ data });
  });

  app.get('/subjects', async (c) => {
    const domainId = c.req.query('domainId');
    if (domainId === undefined || domainId.length === 0) {
      return c.json({ error: 'domainId is required', code: 'BAD_REQUEST' }, 400);
    }
    const data = await hierarchyService.getSubjects(domainId);
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({ data });
  });

  app.get('/topics', async (c) => {
    const subjectId = c.req.query('subjectId');
    if (subjectId === undefined || subjectId.length === 0) {
      return c.json({ error: 'subjectId is required', code: 'BAD_REQUEST' }, 400);
    }
    const data = await hierarchyService.getTopics(subjectId);
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({ data });
  });

  app.get('/subtopics', async (c) => {
    const topicId = c.req.query('topicId');
    if (topicId === undefined || topicId.length === 0) {
      return c.json({ error: 'topicId is required', code: 'BAD_REQUEST' }, 400);
    }
    const data = await hierarchyService.getSubtopics(topicId);
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({ data });
  });

  app.post('/subtopics', requireAuth, requireRoles(['admin', 'super_admin']), async (c) => {
    const parsed = subtopicSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'BAD_REQUEST', issues: parsed.error.flatten() }, 400);
    }

    const data = await hierarchyService.createSubtopic(parsed.data);
    return c.json({ data }, 201);
  });

  return app;
};
