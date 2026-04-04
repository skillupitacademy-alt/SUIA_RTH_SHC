import { describe, expect, it } from 'vitest';
import { TokenService } from '@quiz/auth';

import { Hono } from 'hono';

import { createHierarchyRoutes } from '../hierarchy.routes';

const hierarchyService = {
  getDomains: async () => [{ id: 'd1', name: 'Full Stack', slug: 'full-stack', description: 'desc' }],
  getSubjects: async () => [{ id: 's1', domainId: 'd1', name: 'JavaScript', slug: 'javascript', description: 'desc' }],
  getTopics: async () => [{ id: 't1', subjectId: 's1', name: 'Async', slug: 'async', description: 'desc' }],
  getSubtopics: async () => [{ id: 'st1', topicId: 't1', name: 'Promises', slug: 'promises', description: 'desc', difficultyLevels: ['beginner'] }],
  createSubtopic: async () => ({ id: 'st2', topicId: 't1', subjectId: 's1', domainId: 'd1', name: 'JavaScript Promises', slug: 'javascript-promises', description: 'desc', difficultyLevels: ['beginner'] }),
};

describe('hierarchy routes', () => {
  it('serves public hierarchy data with cache headers', async () => {
    const app = new Hono().route('/api/hierarchy', createHierarchyRoutes(hierarchyService as any));

    const response = await app.request('/api/hierarchy/domains');
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('creates a subtopic for admin users', async () => {
    const app = new Hono().route('/api/hierarchy', createHierarchyRoutes(hierarchyService as any));
    const token = await new TokenService().signSkillHubCoreAccessToken('admin-1', ['admin'], ['notes']);

    const response = await app.request('/api/hierarchy/subtopics', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        topicId: '11111111-1111-1111-1111-111111111111',
        subjectId: '22222222-2222-2222-2222-222222222222',
        domainId: '33333333-3333-3333-3333-333333333333',
        name: 'JavaScript Promises',
        slug: 'javascript-promises',
        description: 'desc',
        difficultyLevels: ['beginner'],
      }),
    });

    expect(response.status).toBe(201);
  });
});
